import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, chmodSync, readFileSync, existsSync, readdirSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const launcher=fileURLToPath(new URL('./remote-mac.sh',import.meta.url));
const app='/tmp/pointliner-mcp-abc/pointliner-live-xyz/index.html', pairing=app.replace('index.html','pairing.txt');
const sshMock=`#!/usr/bin/python3
import sys,os,socket,time,signal
args=sys.argv[1:]; mode=os.environ.get('MOCK_MODE',''); log=os.environ['MOCK_LOG']
with open(log,'a') as f: f.write(repr(args)+'\\n')
if '-N' in args:
 if mode in ('collision','badssh'): sys.exit(1)
 p=args[args.index('-S')+1]; s=socket.socket(socket.AF_UNIX); s.bind(p); s.listen()
 def end(*a):
  open(os.environ['MOCK_STOP'],'w').write('stopped'); s.close(); sys.exit(0)
 signal.signal(signal.SIGTERM,end)
 while True: time.sleep(.1)
if '-O' in args: sys.exit(0)
if args[-1].endswith('/index.html'):
 if mode=='copyfail': sys.exit(1)
 print('<html>disposable</html>'); sys.exit(0)
if args[-1].endswith('/pairing.txt'):
 if mode=='secretfail': sys.exit(1)
 print('SECRET_FOR_TEST'); sys.exit(0)
sys.exit(2)
`;
const ptyHarness=`import os,pty,subprocess,sys,select,time,signal
master,slave=pty.openpty()
p=subprocess.Popen(sys.argv[1:],stdin=slave,stdout=slave,stderr=slave,close_fds=True);os.close(slave)
b=b''; sent=False; deadline=time.monotonic()+8
while time.monotonic()<deadline and p.poll() is None:
 ready,_,_=select.select([master],[],[],.05)
 if ready:
  try: b+=os.read(master,65536)
  except OSError: break
 if b'Press Enter to display' in b and not sent: os.write(master,b'\\n');sent=True
 if b'Keep this terminal open' in b: p.send_signal(signal.SIGTERM); break
try: p.wait(timeout=3)
except subprocess.TimeoutExpired: p.kill();p.wait();b+=b'\\nTIMEOUT'
try:
 while select.select([master],[],[],0)[0]: b+=os.read(master,65536)
except OSError: pass
os.close(master);sys.stdout.buffer.write(b);sys.exit(p.returncode if p.returncode>=0 else 128-p.returncode)
`;
function setup(mode='') {
 const dir=mkdtempSync(join(tmpdir(),'remote-mac-test-')), bin=join(dir,'bin');
 mkdirSync(bin); const ssh=join(bin,'ssh'); writeFileSync(ssh,sshMock); chmodSync(ssh,0o755);
 const open=join(bin,'open'); writeFileSync(open,"#!/bin/sh\n[ \"$MOCK_MODE\" != openfail ] || exit 1\n[ \"$(stat -c %a \"$1\")\" = 600 ] || exit 2\nprintf '%s\\n' \"$1\" > \"$MOCK_APP\"\n"); chmodSync(open,0o755);
 if(mode==='chmodfail') {const ch=join(bin,'chmod');writeFileSync(ch,'#!/bin/sh\nexit 1\n');chmodSync(ch,0o755);}
 if(mode==='permissions') {const mk=join(bin,'mktemp');writeFileSync(mk,'#!/bin/sh\nexit 1\n');chmodSync(mk,0o755);}
 return {dir,bin,env:{...process.env,PATH:bin+':'+process.env.PATH,TMPDIR:dir,MOCK_MODE:mode,MOCK_LOG:join(dir,'ssh.log'),MOCK_APP:join(dir,'app.path'),MOCK_STOP:join(dir,'stop')}};
}
function runPty(f, args=['user@100.102.43.48','39119',app,pairing]) {
 return spawnSync('/usr/bin/python3',['-c',ptyHarness,launcher,...args],{env:f.env,encoding:'utf8',timeout:12000});
}

test('validates untrusted arguments before starting SSH', () => {
 const f=setup();
 try {
  for(const args of [
   ['-oProxyCommand=evil','39119',app,pairing],['host;touch-x','39119',app,pairing],
   ['host','0',app,pairing],['host','65536',app,pairing],['host','039119',app,pairing],
   ['host','39119',app+';id',pairing],['host','39119',app.replace('xyz','../oops'),pairing],
   ['host','39119',app,pairing+';id'],
   ['user@host\nevil','39119',app,pairing], ['evil\nuser@host','39119',app,pairing],
   ['host','39119',app+'\nid',pairing], ['host','39119','bad\n'+app,pairing],
   ['host','39119',app,pairing+'\nid'], ['host','39119',app,'bad\n'+pairing],
   ['host\tbad','39119',app,pairing], ['host','39119',app+'\r',pairing],['host','39119',app,'/tmp/other/pairing.txt']
  ]) {
   const r=spawnSync(launcher,args,{env:f.env,encoding:'utf8',timeout:3000});
   assert.equal(r.status,1,JSON.stringify(args)); assert.match(r.stderr,/Invalid|Unexpected|does not match/);
  }
  assert.equal(existsSync(f.env.MOCK_LOG),false);
 } finally {rmSync(f.dir,{recursive:true,force:true});}
});

test('copies private app, uses verified loopback SSH and cleans owned tunnel', {timeout:15000}, () => {
 const f=setup(); const unrelated=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
 try {
  const r=runPty(f); assert.ok(!r.error,String(r.error)); assert.match(r.stdout,/SECRET_FOR_TEST/);
  assert.match(r.stdout,/Keep this terminal open/); assert.ok(existsSync(f.env.MOCK_STOP));
  assert.doesNotThrow(()=>process.kill(unrelated.pid,0),'unrelated process must remain running');
  const localApp=readFileSync(f.env.MOCK_APP,'utf8').trim(); assert.equal(existsSync(localApp),false);
  const log=readFileSync(f.env.MOCK_LOG,'utf8');
  assert.match(log,/'-F', '\/dev\/null'/); assert.match(log,/StrictHostKeyChecking=yes/); assert.match(log,/ExitOnForwardFailure=yes/);
  assert.match(log,/127\.0\.0\.1:39119:127\.0\.0\.1:39119/);
  assert.ok(!log.includes('SECRET_FOR_TEST')); assert.ok(!readdirSync(f.dir).some(n=>n.startsWith('pointliner-remote.')));
 } finally {unrelated.kill(); rmSync(f.dir,{recursive:true,force:true});}
});

test('SSH, local copy, app launch, and temp permission failures fail closed', {timeout:30000}, () => {
 for (const [mode, expected] of [['collision',/SSH tunnel failed/],['badssh',/SSH tunnel failed/],['copyfail',/Could not copy/],['openfail',/Could not open/],['secretfail',/Could not retrieve/],['permissions',/Could not create private/],['chmodfail',/Could not secure temporary/]]) {
  const f=setup(mode);
  try {
   const r=runPty(f); assert.notEqual(r.status,0,mode); assert.match(r.stdout,expected,mode);
   assert.ok(!readdirSync(f.dir).some(n=>n.startsWith('pointliner-remote.')),mode);
   if (['copyfail','openfail','secretfail'].includes(mode)) assert.ok(existsSync(f.env.MOCK_STOP),mode);
  } finally {rmSync(f.dir,{recursive:true,force:true});}
 }
});

test('real OpenSSH resolves loopback-only forwarding and strict host keys', () => {
 const r=spawnSync('/usr/bin/ssh',['-G','-F','/dev/null','-o','StrictHostKeyChecking=yes','-o','BatchMode=yes','-o','ExitOnForwardFailure=yes','-L','127.0.0.1:39119:127.0.0.1:39119','znt@100.102.43.48'],{encoding:'utf8',timeout:5000});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/^localforward (?:\[127\.0\.0\.1\]|127\.0\.0\.1):39119 (?:\[127\.0\.0\.1\]|127\.0\.0\.1):39119$/m);
 assert.match(r.stdout,/^stricthostkeychecking (?:true|yes)$/m); assert.match(r.stdout,/^exitonforwardfailure yes$/m);
});
