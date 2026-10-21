import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceInput } from '../src/voiceInput.ts';

class Recognition {
  static instance: any;
  onresult: any; onend: any; onerror: any; onspeechstart: any; onspeechend: any;
  starts = 0;
  constructor() { Recognition.instance = this; }
  start() { this.starts++; }
  stop() { this.onend?.(); }
  abort() { this.onend?.(); }
}

function setup(t: any) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sent: string[] = [];
  const controller = createVoiceInput(Recognition, {
    language: 'et-EE', onText() {}, onSend: text => sent.push(text),
    onListening() {}, onError() {},
  });
  controller.start();
  const rec = Recognition.instance;
  const say = (text: string) => rec.onresult({ results: [[{ transcript: text }]] });
  return { controller, rec, say, sent };
}

test('sends once at three seconds, resetting the pause when more words arrive', t => {
  const { say, sent } = setup(t);
  say('Tere');
  t.mock.timers.tick(2000);
  say('Tere Erik');
  t.mock.timers.tick(2999);
  assert.deepEqual(sent, []);
  t.mock.timers.tick(1);
  assert.deepEqual(sent, ['Tere Erik']);
  t.mock.timers.tick(10000);
  assert.equal(sent.length, 1);
});
test('stopping the mic cancels a pending send and ignores late results', t => {
  const { controller, say, sent } = setup(t);
  say('Tere'); controller.cancel(); say('Late result');
  t.mock.timers.tick(4000);
  assert.deepEqual(sent, []);
});
test('silence without words never sends an empty question', t => {
  const { rec, sent } = setup(t);
  rec.onspeechend(); rec.onend();
  t.mock.timers.tick(4000);
  assert.deepEqual(sent, []);
});
test('browser ending recognition does not send early or lose the next phrase', t => {
  const { rec, say, sent } = setup(t);
  say('Tere'); rec.onend();
  assert.equal(rec.starts, 2);
  say('Erik');
  t.mock.timers.tick(3000);
  assert.deepEqual(sent, ['Tere Erik']);
});
test('a recognition error cancels pending submission', t => {
  const { rec, say, sent } = setup(t);
  say('Tere'); rec.onerror({ error: 'not-allowed' });
  t.mock.timers.tick(4000);
  assert.deepEqual(sent, []);
});
