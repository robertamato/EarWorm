    if(!tlpairs.length){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }
    if(stage<=1){
      var tlp=tlpairs[Math.floor(Math.random()*tlpairs.length)];
      var CJKf3="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";
      prompt=tlp.zh;
      correctChoice=tlp.en.toUpperCase();
      var tlOthers=tlpairs.filter(function(p){return p.zh!==tlp.zh;}).map(function(p){return p.en.toUpperCase();});
      var choicePool=[tlp.en.toUpperCase(),...tlOthers].filter(function(v,i,a){return a.indexOf(v)===i;});
      // Pad to 4 with cross-category EN terms so choice count is always even
      if(choicePool.length<4){
        GRAMMAR_CATS.forEach(function(c){
          var cPairs=(GRAMMAR_CONTENT[c]&&GRAMMAR_CONTENT[c].s4&&GRAMMAR_CONTENT[c].s4.pairs)||[];
          cPairs.forEach(function(p){
            if(choicePool.length>=4) return;
            var en=p.en.toUpperCase();
            if(!choicePool.includes(en)) choicePool.push(en);
          });
        });
      }
      choices=shuffle(choicePool.slice(0,4));
      if(choices.indexOf(correctChoice)<0) choices[choices.length-1]=correctChoice;
      choices=shuffle(choices);
      $('studyPOSChar').style.cssText=CJKf3+';font-size:28px;color:'+fg+';text-align:center;';
      $('studyPOSChar').textContent=prompt;
      if(pyEl) pyEl.innerHTML='<span style="font-size:9px;opacity:.7;letter-spacing:1px;font-family:inherit;">'+tlp.py+'</span><br><span style="font-size:7px;opacity:.5;letter-spacing:1px;">WHICH ENGLISH TERM MATCHES?</span>';
      prompt='__CJK_HANDLED__';
    } else if(stage===2){
      var tlp2=tlpairs[Math.floor(Math.random()*tlpairs.length)];
      prompt=tlp2.en.toUpperCase()+' \u2014 '+tlp2.ex;
      correctChoice=tlp2.zh;
      var tlOthers2=tlpairs.filter(function(p){return p.zh!==tlp2.zh;}).map(function(p){return p.zh;});
      var tlExtra=Object.values(POS_ZH).filter(function(z){return !tlpairs.map(function(p){return p.zh;}).includes(z);}).slice(0,2);
      choices=shuffle([tlp2.zh,...tlOthers2,...tlExtra].filter(function(v,i,a){return a.indexOf(v)===i;})).slice(0,4);
      if(choices.indexOf(correctChoice)<0) choices[choices.length-1]=correctChoice;
      choices=shuffle(choices);
      if(pyEl) pyEl.innerHTML='<span style="font-size:7px;opacity:.6;letter-spacing:1px;">WHICH MANDARIN TERM?</span>';
    } else {
      showGrammarStage5(cat, fg);
      return;
    }
  }

  if(!correctChoice){ recordAxisResultG(cat,axis,true,100); nextStudyCard(); return; }

  if(prompt!=='__CJK_HANDLED__'){
    $('studyPOSChar').style.cssText='font-size:11px;font-family:inherit;color:'+fg+';line-height:1.5;text-align:left;';
    $('studyPOSChar').textContent=prompt;
  }

  var box=$('studyPOSChoices'); box.innerHTML='';
  var choiceFont=(axis==='tl_integration'&&stage<=1)?"font-family:'PingFang SC','Heiti SC',sans-serif;font-size:18px;":"font-size:8px;";
  box.style.gridTemplateColumns=choices.length<=4?'1fr 1fr':'1fr 1fr 1fr';
  var locked=false;

  choices.forEach(function(ch){
    var b=document.createElement('button');
    b.className='choice';
    b.style.cssText=choiceFont+'border-color:'+fg+';color:'+fg+';padding:10px 6px;line-height:1.5;text-align:center;';
    b.textContent=ch;
    b.onclick=function(){
      if(locked) return; locked=true;
      var isCorrect=ch===correctChoice;
      var respMs=Date.now()-cardShownAtMC;
      document.querySelectorAll('#studyPOSChoices .choice').forEach(function(tb){
        if(tb.textContent===correctChoice) tb.classList.add('correct');
        else if(tb===b&&!isCorrect) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });
      recordChallengeResult(-1,'grammar:'+cat+':'+axis,isCorrect,respMs);
      recordAxisResultG(cat,axis,isCorrect,respMs);
      recordGrammarAttempt(cat.toLowerCase(),isCorrect);
      if(isCorrect){
        advanceMult();
        S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier());
        sessionGrammarAnswered.add(cat+':'+axis);
      } else {
        resetMult();
      }
      save();
      armTapAdvance($('studyPOS'),function(){nextStudyCard();},isCorrect?0:1200);
    };
    box.appendChild(b);
  });

  studyDontKnowAction=function(){
    recordAxisResultG(cat,axis,false,Date.now()-cardShownAtMC);
    armTapAdvance($('studyPOS'),function(){nextStudyCard();},1200);
  };
  renderWagerControl('studyPOSWager',-1);

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='none';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='flex';
  if($('studyColl')) $('studyColl').style.display='none';
}



/* ============ EXAMPLE SENTENCES ============ */
// Keyed by character. Each sentence: [mandarin, pinyin, english_gloss]
// Used for cloze questions and word order drills.
// Sentences use high-frequency vocabulary where possible.
const EXAMPLE_SENTENCES={
  "的":[["我的书在哪里？","wǒ de shū zài nǎlǐ?","Where is my book?"],["这是我的。","zhè shì wǒ de.","This is mine."],["好的人很多。","hǎo de rén hěn duō.","There are many good people."]],
  "我":[["我是学生。","wǒ shì xuésheng.","I am a student."],["我不知道。","wǒ bù zhīdào.","I don't know."],["我很好。","wǒ hěn hǎo.","I am fine."]],
  "你":[["你好！","nǐ hǎo!","Hello!"],["你是谁？","nǐ shì shéi?","Who are you?"],["你去哪里？","nǐ qù nǎlǐ?","Where are you going?"]],
  "是":[["他是老师。","tā shì lǎoshī.","He is a teacher."],["这是什么？","zhè shì shénme?","What is this?"],["我是中国人。","wǒ shì zhōngguórén.","I am Chinese."]],
  "了":[["我吃了。","wǒ chī le.","I ate."],["他走了。","tā zǒu le.","He left."],["她来了。","tā lái le.","She came."]],
  "不":[["我不去。","wǒ bù qù.","I'm not going."],["他不是学生。","tā bù shì xuésheng.","He is not a student."],["不好。","bù hǎo.","Not good."]],
  "他":[["他很好。","tā hěn hǎo.","He is very good."],["他走了。","tā zǒu le.","He left."],["他是我的朋友。","tā shì wǒ de péngyou.","He is my friend."]],
  "她":[["她很好。","tā hěn hǎo.","She is very good."],["她不来。","tā bù lái.","She is not coming."],["她不来了。","tā bù lái le.","She's not coming anymore."]],
  "们":[["我们去吃饭。","wǒmen qù chīfàn.","Let's go eat."],["他们是朋友。","tāmen shì péngyou.","They are friends."],["你们好！","nǐmen hǎo!","Hello everyone!"]],
  "在":[["他在家。","tā zài jiā.","He is at home."],["书在这里。","shū zài zhèlǐ.","The book is here."],["我在看书。","wǒ zài kàn shū.","I am reading."]],
  "有":[["我有书。","wǒ yǒu shū.","I have a book."],["这里有很多人。","zhèlǐ yǒu hěn duō rén.","There are many people here."],["他有钱。","tā yǒu qián.","He has money."]],
  "这":[["这是什么？","zhè shì shénme?","What is this?"],["这个很好。","zhège hěn hǎo.","This one is good."],["我要这个。","wǒ yào zhège.","I want this one."]],
  "一":[["一个人。","yīgè rén.","One person."],["一起去。","yīqǐ qù.","Go together."],["一点儿。","yīdiǎnr.","A little bit."]],
  "说":[["他说了。","tā shuō le.","He spoke."],["你说什么？","nǐ shuō shénme?","What did you say?"],["她说很多。","tā shuō hěn duō.","She says a lot."]],
  "没":[["我没有钱。","wǒ méiyǒu qián.","I have no money."],["他没来。","tā méi lái.","He didn't come."],["没问题。","méi wèntí.","No problem."]],
  "那":[["那是什么？","nà shì shénme?","What is that?"],["那个人是谁？","nàgè rén shì shéi?","Who is that person?"],["那很好。","nà hěn hǎo.","That is good."]],
  "来":[["他来了。","tā lái le.","He came."],["你来这里。","nǐ lái zhèlǐ.","Come here."],["我来看你。","wǒ lái kàn nǐ.","I'll come see you."]],
  "好":[["你好！","nǐ hǎo!","Hello!"],["很好。","hěn hǎo.","Very good."],["好的。","hǎo de.","Okay."]],
  "到":[["他到了。","tā dào le.","He arrived."],["我到家了。","wǒ dào jiā le.","I arrived home."],["到哪里去？","dào nǎlǐ qù?","Where are you going?"]],
  "要":[["我要水。","wǒ yào shuǐ.","I want water."],["你要什么？","nǐ yào shénme?","What do you want?"],["我要去。","wǒ yào qù.","I want to go."]],
  "都":[["我们都去。","wǒmen dōu qù.","We are all going."],["他们都是学生。","tāmen dōu shì xuésheng.","They are all students."],["都好。","dōu hǎo.","All good."]],
  "和":[["我和你。","wǒ hé nǐ.","You and I."],["茶和水。","chá hé shuǐ.","Tea and water."],["他和她是朋友。","tā hé tā shì péngyou.","He and she are friends."]],
  "也":[["我也去。","wǒ yě qù.","I'm going too."],["他也是学生。","tā yě shì xuésheng.","He is also a student."],["也好。","yě hǎo.","That works too."]],
  "人":[["这个人是谁？","zhège rén shì shéi?","Who is this person?"],["很多人来了。","hěn duō rén lái le.","Many people came."],["中国人。","zhōngguórén.","Chinese person."]],
  "什么":[["这是什么？","zhè shì shénme?","What is this?"],["你要什么？","nǐ yào shénme?","What do you want?"],["他说什么？","tā shuō shénme?","What did he say?"]],
  "会":[["我会说。","wǒ huì shuō.","I can speak."],["他不会来。","tā bù huì lái.","He won't come."],["你会吗？","nǐ huì ma?","Can you?"]],
  "去":[["我去了。","wǒ qù le.","I went."],["他去看书了。","tā qù kàn shū le.","He went to read."],["你去哪里？","nǐ qù nǎlǐ?","Where are you going?"]],
  "可以":[["我可以来。","wǒ kěyǐ lái.","I can come."],["可以吗？","kěyǐ ma?","Is it okay?"],["不可以。","bù kěyǐ.","Not allowed."]],
  "很":[["他很好。","tā hěn hǎo.","He is very good."],["很多人。","hěn duō rén.","Many people."],["很多书。","hěn duō shū.","Many books."]],
  "知道":[["我知道。","wǒ zhīdào.","I know."],["你知道吗？","nǐ zhīdào ma?","Do you know?"],["我不知道。","wǒ bù zhīdào.","I don't know."]],
  "吗":[["你好吗？","nǐ hǎo ma?","How are you?"],["他来吗？","tā lái ma?","Is he coming?"],["是吗？","shì ma?","Really?"]],
  "上":[["他走上来了。","tā zǒu shàng lái le.","He came up."],["他上来了。","tā shàng lái le.","He came up."]],
  "时候":[["什么时候？","shénme shíhou?","When?"],["那时候。","nà shíhou.","At that time."]],
  "能":[["我能来。","wǒ néng lái.","I can come."],["你能来吗？","nǐ néng lái ma?","Can you come?"],["他不能来。","tā bù néng lái.","He cannot come."]],
  "就":[["我就来。","wǒ jiù lái.","I'll be right there."],["就是这个。","jiù shì zhège.","It is exactly this."]],
  "对":[["对。","duì.","Correct."],["你说对了。","nǐ shuō duì le.","You said it right."],["对了。","duì le.","That's right."]],
  "自己":[["我自己来。","wǒ zìjǐ lái.","I'll come myself."],["他自己知道。","tā zìjǐ zhīdào.","He knows himself."]],
  "里":[["家里。","jiā lǐ.","Inside the home."],["这里有什么？","zhèlǐ yǒu shénme?","What is here?"],["他在这里。","tā zài zhèlǐ.","He is here."]],
  "就":[["他就是老师。","tā jiù shì lǎoshī.","He is indeed a teacher."]],
  "后":[["以后。","yǐhòu.","Afterwards / in the future."],["他后来来了。","tā hòulái lái le.","He came later."]],
  "还":[["还好。","hái hǎo.","Still okay."],["他还在。","tā hái zài.","He is still here."],["还有。","hái yǒu.","There is more."]],
  "只":[["只有我。","zhǐ yǒu wǒ.","Only me."],["只是。","zhǐ shì.","It's just that."]],
  "大":[["大学。","dàxué.","University."],["很大。","hěn dà.","Very big."],["大家好！","dàjiā hǎo!","Hello everyone!"]],
};


/* ============ CLOZE MODALITY ============ */
// Fill-in-the-blank: sentence shown with target word removed.
// User selects from 4 choices. Tests meaning in grammatical context.
// Harder than MC forward — context dependency means choices can be similar words.
// Unlocks at meaning axis stage >= 2.

// Puzzle-source seam. Static bank today; a generation backend can implement
// the same signature later (per-course, unique, language-agnostic). Returns an
// array of [target, pinyin, gloss] sentences for word i.
function getPuzzleSentences(i){
  try{ return EXAMPLE_SENTENCES[D[i][0]]||[]; }catch(e){ return []; }
}

function clozeUnlocked(i){
  if(getPuzzleSentences(i).length===0) return false;
  // v2: context is reachable at recognition level — one sighting unlocks it, so
  // depth accrues THROUGH context instead of being gated behind isolated
  // mastery. v1 keeps the original meaning-stage-2 gate.
  if(newSchedulerPolicy()) return (card(i).exp||0)>=1;
  return getAxisStage(i,'meaning')>=2;
}

function speakWithBlank(zh,ch,langCode){
  const idx=zh.indexOf(ch);
  if(idx<0){ speak(zh,langCode); return; }
  const before=zh.slice(0,idx);
  const after=zh.slice(idx+ch.length);
  if(!before&&!after){ speak(zh,langCode); return; }

  if(!before){
    // Blank at start: cancel stale speech, bump gen so any deferred speak() aborts,
    // then beep → speak suffix.
    try{ speechSynthesis.cancel(); }catch(e){}
    ++_ttsGen;
    const myGen=_ttsGen;
    beepBlank(function(){ if(_ttsGen===myGen) speak(after,langCode); });
    return;
  }
  if(!after){
    // Blank at end: speak prefix → beep (no further chain).
    speak(before,langCode,function(){ beepBlank(); });
    return;
  }
  // Blank in middle: speak prefix → beep → speak suffix.
  // expectedGen is the gen that speak(before) is about to claim (++_ttsGen).
  // fireBeep is guarded by both the beeped flag (prevents double-fire) and the
  // gen check (prevents firing if a newer card has taken over).
  // Backstop timer fires if onend is unreliable on Windows for short syllables.
  const expectedGen=_ttsGen+1;
  const cjk=(before.match(/[一-鿿㐀-䶿]/g)||[]).length;
  let beeped=false;
  const fireBeep=function(){
    if(beeped||_ttsGen!==expectedGen) return;
    beeped=true;
    beepBlank(function(){ if(_ttsGen===expectedGen) speak(after,langCode); });
  };
  speak(before,langCode,fireBeep);
  setTimeout(fireBeep,400+cjk*500);
}

function showStudyCloze(i){
  const [ch,syls,def,,pos]=D[i];
  const sents=EXAMPLE_SENTENCES[ch]||[];
  if(!sents.length){ nextStudyCard(); return; }

  activeCardIdx=i;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  // Pick a sentence — only use sentences where every multi-char D[] word is already introduced
  const validSents=sents.filter(function(s){ return sentenceAllIntroduced(s[0]); });
  if(!validSents.length){ nextStudyCard(); return; }
  const sent=validSents[Math.floor(Math.random()*validSents.length)];
  const [zh,py,en]=sent;

  // Fire TTS before DOM build so audio arrives with the visual
  if(S.sound!=='mute'){
    const stg=getAxisStage(i,'meaning');
    if(stg<3){ speak(zh,activeCourse().langCode); }
    else { speakWithBlank(zh,ch,activeCourse().langCode); }
  }

  // Create cloze: replace target word with blank
  const blank='___';
  const clozeZH=zh.replace(ch,blank);

  $('studyMode').textContent='CLOZE · FILL THE BLANK';
  cardShownAtMC=Date.now();

  // Stage-based target: 2 choices at stage 2, 4 at stage 3+
  const clozeStg=getAxisStage(i,'meaning');
  const targetChoices=clozeStg>=3?4:2;
  // Pick distractors ranked by utility (POS match, frequency proximity, shared radical)
  let distractors=pickCharDistractors(i,targetChoices-1);
  // Enforce even total: distractors count must be odd (1→total 2, 3→total 4)
  if(distractors.length%2===0) distractors=distractors.slice(0,distractors.length-1);
  if(!distractors.length){ nextStudyCard(); return; }
  const choices=shuffle([ch,...distractors]);

  // Render into study panel — reuse MC panel
  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='flex';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';
  if($('studyColl')) $('studyColl').style.display='none';

  // Rank
  $('studyMCRank').textContent=cardRankStr(i);
  $('studyMCModality').textContent='CLOZE \u00b7 FILL THE BLANK';

  // Sentence with blank — phi-units (char above, pinyin below) per character
  const promptEl=$('studyMCPromptText');
  promptEl.innerHTML='';

  const sentRow=document.createElement('div');
  sentRow.style.cssText='display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:4px;margin-bottom:8px;';

  const blankStart=zh.indexOf(ch);
  const isCJKChar=function(c){return /[一-鿿㐀-䶿]/.test(c);};
  let ci=0;
  while(ci<zh.length){
    const c=zh[ci];
    if(blankStart>=0&&ci===blankStart){
      const bUnit=document.createElement('div');
      bUnit.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;';
      const bChar=document.createElement('span');
      bChar.innerHTML='&nbsp;';
      bChar.style.cssText='font-size:28px;line-height:1;display:inline-block;min-width:'+(ch.length*1.1)+'em;border-bottom:3px solid '+fg+';text-align:center;';
      bUnit.appendChild(bChar);
      const bPy=document.createElement('span');
      bPy.style.cssText='font-size:9px;height:12px;display:block;';
      bUnit.appendChild(bPy);
      sentRow.appendChild(bUnit);
      ci+=ch.length;
      continue;
    }
    if(isCJKChar(c)){
      const syl=charSyl(c);
      const unit=document.createElement('div');
      unit.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;';
      const cSpan=document.createElement('span');
      cSpan.textContent=c;
      cSpan.style.cssText='font-size:28px;line-height:1;'+CJKf;
      unit.appendChild(cSpan);
      if(syl){
        const pSpan=document.createElement('span');
        pSpan.textContent=syl[0];
        pSpan.style.cssText='font-size:9px;font-family:\'Noto Sans\',Arial,sans-serif;';
        pSpan.style.color=toneColor(syl[1],fg);
        unit.appendChild(pSpan);
      }
      sentRow.appendChild(unit);
    } else {
      const plain=document.createElement('span');
      plain.textContent=c;
      plain.style.cssText='font-size:28px;line-height:1;align-self:flex-start;opacity:.5;';
      sentRow.appendChild(plain);
    }
    ci++;
  }
  promptEl.appendChild(sentRow);
  const glossDiv=document.createElement('div');
  glossDiv.style.cssText='font-size:10px;opacity:.6;text-align:center;font-style:italic;';
  glossDiv.textContent=en;
  promptEl.appendChild(glossDiv);

  $('studyMCPinyin').innerHTML='';

  // Choices — CJK characters
  const box=$('studyMCChoices');
  box.innerHTML='';
  box.style.gridTemplateColumns='1fr 1fr';
  let locked=false;

  // Tap prompt area to repeat TTS before answering
  $('studyMCPrompt').style.cursor='pointer';
  $('studyMCPrompt').onclick=function(e){
    if(locked||S.sound==='mute') return;
    const stg=getAxisStage(i,'meaning');
    if(stg<3){ speak(zh,activeCourse().langCode); }
    else { speakWithBlank(zh,ch,activeCourse().langCode); }
    e.stopPropagation();
  };

  choices.forEach(function(opt){
    const b=document.createElement('button');
    b.className='choice';
    // Phi-unit: character above, pinyin below
    b.style.cssText='border-color:'+fg+';color:'+fg+
      ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 6px;';
    const charSpan=document.createElement('span');
    charSpan.textContent=opt;
    charSpan.style.cssText='font-size:36px;line-height:1;'+CJKf;
    b.appendChild(charSpan);
    const optIdx=D.findIndex(function(d){return d[0]===opt;});
    if(optIdx>=0&&D[optIdx][1].length){
      const pyWrap=document.createElement('span');
      pyWrap.style.cssText='font-size:9px;display:flex;gap:2px;font-family:\'Noto Sans\',Arial,sans-serif;';
      D[optIdx][1].forEach(function([s,t]){
        const sEl=document.createElement('span'); sEl.textContent=s; sEl.style.color=toneColor(t,fg);
        pyWrap.appendChild(sEl);
      });
      b.appendChild(pyWrap);
    }
    b.onclick=function(){
      if(locked) return; locked=true;
      const isCorrect=opt===ch;
      const respMs=Date.now()-cardShownAtMC;
      document.querySelectorAll('#studyMCChoices .choice').forEach(function(tb){
        if(tb.textContent===ch) tb.classList.add('correct');
        else if(tb===b&&!isCorrect) tb.classList.add('wrong');
        tb.style.pointerEvents='none';
      });
      recordChallengeResult(i,'cloze',isCorrect,respMs);
      recordAxisResultNew(i,'meaning',isCorrect,respMs);
      recordWagerDecision(i,isCorrect,currentMultIdx,defaultMultIdx,respMs);
      logAnswer(i,isCorrect,'cloze',respMs);
      const speedM=respMs<1500?1.3:respMs<4000?1.0:0.8;
      if(isCorrect){
        advanceMult();
        S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier());
        addMastery(i,0.5*speedM); // cloze is harder — more mastery gain
      } else {
        resetMult();
        addMastery(i,-0.3);
        studyPending.push({idx:i,mod:'cloze'});
      }
      save();
      if(S.sound!=='mute') speak(zh,activeCourse().langCode);
      // Make char tappable to open dictionary
      promptEl.style.cursor='pointer';
      promptEl.onclick=function(e){ e.stopPropagation(); openCharDetail(ch,0,i); };
      armTapAdvance($('studyMC'),function(){nextStudyCard();},isCorrect?0:1200);
    };
    box.appendChild(b);
  });

  renderChallengeRings(i,'cloze',$('studyMCPrompt'));
  studyDontKnowAction=function(){
    if(locked) return; locked=true;
    recordAxisResultNew(i,'meaning',false,Date.now()-cardShownAtMC);
    addMastery(i,-0.3);
    studyPending.push({idx:i,mod:'cloze'});
    armTapAdvance($('studyMC'),function(){nextStudyCard();},1200);
  };
  renderWagerControl('studyMCActions',i);
}

/* ============ WORD ORDER MODALITY ============ */
// Given 3-4 shuffled words, tap them in correct Mandarin order.
// Bridges from receptive to productive — requires applying grammar knowledge.
// Unlocks when: meaning stage >= 2, grammar categorization stage >= 1 for all words.

function wordOrderUnlocked(i){
  if(getAxisStage(i,'meaning')<2) return false;
  // Need at least 2 other introduced words for a meaningful arrangement
  const introduced=D.filter(function(_,idx){return S.cards[idx]&&S.cards[idx].exp>0;});
  return introduced.length>=4;
}

function showWordOrderDrill(i){
  const [ch,syls,def,,pos]=D[i];
  // Find a sentence containing this word
  const sents=EXAMPLE_SENTENCES[ch]||[];
  if(!sents.length){ nextStudyCard(); return; }
  // Only use sentences where every multi-char D[] word is already introduced
  const validSentsWO=sents.filter(function(s){ return sentenceAllIntroduced(s[0]); });
  if(!validSentsWO.length){ nextStudyCard(); return; }
  const sent=validSentsWO[Math.floor(Math.random()*validSentsWO.length)];
  const [zh,py,en]=sent;

  // Extract words — split on common boundaries
  // Simple tokenizer: split on punctuation, keep CJK chars grouped by known words
  const introduced=D.filter(function(_,idx){return S.cards[idx]&&S.cards[idx].exp>0;}).map(function(d){return d[0];});
  // Find 3-4 known words that appear in this sentence
  const wordsInSent=introduced.filter(function(w){return zh.includes(w)&&w.length>0;});
  if(wordsInSent.length<3){ nextStudyCard(); return; }
  // Take up to 4 words, ensure target word is included
  let drillWords=[ch,...wordsInSent.filter(function(w){return w!==ch;}).slice(0,3)];
  if(drillWords.length<3){ nextStudyCard(); return; }
  drillWords=drillWords.slice(0,4);

  // Correct order: words as they appear in zh
  const correctOrder=drillWords.slice().sort(function(a,b){
    return zh.indexOf(a)-zh.indexOf(b);
  });
  const shuffledWords=shuffle(drillWords.slice());

  activeCardIdx=i;
  rollBg();
  const fg=getComputedStyle(document.body).color;
  const CJKf="font-family:'PingFang SC','Heiti SC','Noto Sans CJK SC',sans-serif";

  $('studyMode').textContent='WORD ORDER';
  cardShownAtMC=Date.now();

  show('study');
  $('studySession').style.display='none';
  $('studyMC').style.display='flex';
  $('studyTone').style.display='none';
  if($('studyPOS')) $('studyPOS').style.display='none';

  $('studyMCRank').textContent=cardRankStr(i);
  $('studyMCModality').textContent='WORD ORDER \u00b7 ARRANGE';

  // Show English prompt
  const promptEl=$('studyMCPromptText');
  promptEl.innerHTML='<div style="font-size:12px;opacity:.8;text-align:center;line-height:1.5;margin-bottom:8px;">'+
    en.toUpperCase()+'</div>'+
    '<div style="font-size:8px;opacity:.5;letter-spacing:1px;">ARRANGE THESE WORDS IN MANDARIN ORDER</div>';
  $('studyMCPinyin').innerHTML='';

  // Answer slots — user taps words into slots
  const selected=[];
  const box=$('studyMCChoices');
  box.innerHTML='';
  box.style.gridTemplateColumns='repeat('+drillWords.length+',1fr)';

  // Slot display
  const slotRow=document.createElement('div');
  slotRow.style.cssText='display:flex;gap:6px;justify-content:center;margin-bottom:12px;padding:8px 0;border-bottom:1px solid '+fg+';opacity:.3;';
  slotRow.id='wordOrderSlots';
  drillWords.forEach(function(_,si){
    const slot=document.createElement('div');
    slot.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;'+
      'min-width:2.5em;border-bottom:3px solid '+fg+';padding:4px 2px;';
    slot.id='slot'+si;
    slot.innerHTML='<span style="font-size:28px;line-height:1;">\u00a0</span>';
    slotRow.appendChild(slot);
  });
  promptEl.appendChild(slotRow);

  let locked=false;
  // Word buttons
  shuffledWords.forEach(function(w){
    const b=document.createElement('button');
    b.className='choice';
    b.style.cssText='border-color:'+fg+';color:'+fg+
      ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 6px;';
    b.dataset.word=w;
    const wCharSpan=document.createElement('span');
    wCharSpan.textContent=w; wCharSpan.style.cssText='font-size:32px;line-height:1;'+CJKf;
    b.appendChild(wCharSpan);
    const wIdx=D.findIndex(function(d){return d[0]===w;});
    if(wIdx>=0&&D[wIdx][1].length){
      const wPy=document.createElement('span');
      wPy.style.cssText='font-size:9px;display:flex;gap:2px;font-family:\'Noto Sans\',Arial,sans-serif;';
      D[wIdx][1].forEach(function([s,t]){
        const se=document.createElement('span'); se.textContent=s; se.style.color=toneColor(t,fg);
        wPy.appendChild(se);
      });
      b.appendChild(wPy);
    }
    b.onclick=function(){
      if(locked||b.dataset.used) return;
      selected.push(w);
      b.dataset.used='1';
      b.style.opacity='.3';
      // Fill next slot as phi-unit
      const slot=document.getElementById('slot'+(selected.length-1));
      if(slot){
        const sIdx=D.findIndex(function(d){return d[0]===w;});
        const sSyls=sIdx>=0?D[sIdx][1]:[];
        let pyHTML='';
        if(sSyls.length){
          pyHTML='<span style="font-size:9px;display:flex;gap:2px;font-family:\'Noto Sans\',Arial,sans-serif;">';
          sSyls.forEach(function([s,t]){ pyHTML+='<span style="color:'+toneColor(t,fg)+'">'+s+'</span>'; });
          pyHTML+='</span>';
        }
        slot.innerHTML='<span style="font-size:28px;line-height:1;font-family:\'PingFang SC\',\'Heiti SC\',\'Noto Sans CJK SC\',sans-serif;">'+w+'</span>'+pyHTML;
        slot.style.opacity='1';
      }
      // Check if all words placed
      if(selected.length===drillWords.length){
        locked=true;
        const isCorrect=selected.join('')===correctOrder.join('');
        const respMs=Date.now()-cardShownAtMC;
        // Show correct order
        const slotsEl=document.getElementById('wordOrderSlots');
        if(slotsEl){
          slotsEl.style.opacity='1';
          correctOrder.forEach(function(cw,ci){
            const s=document.getElementById('slot'+ci);
            if(s){
              const col=selected[ci]===cw?'hsl(120,70%,50%)':'hsl(0,70%,50%)';
              s.querySelectorAll('span').forEach(function(el){el.style.color=col;});
            }
          });
        }
        recordChallengeResult(i,'word-order',isCorrect,respMs);
        recordAxisResultNew(i,'meaning',isCorrect,respMs);
        logAnswer(i,isCorrect,'word-order',respMs);
        if(isCorrect){
          advanceMult();
          S.xp+=Math.round(computeXP(true,currentMultIdx,respMs)*fatigueXPMultiplier());
          addMastery(i,0.6); // highest mastery gain — hardest receptive modality
          if(S.sound!=='mute') speak(zh,activeCourse().langCode);
        } else {
          resetMult();
          addMastery(i,-0.2);
          studyPending.push({idx:i,mod:'word-order'});
        }
        save();
        armTapAdvance($('studyMC'),function(){nextStudyCard();},isCorrect?0:1500);
      }
    };
    box.appendChild(b);
  });

  if(S.sound!=='mute') setTimeout(function(){ speak(en,'en-US'); },0);

  // Tap prompt area to repeat English TTS before answering
  $('studyMCPrompt').style.cursor='pointer';
  $('studyMCPrompt').onclick=function(e){
    if(locked||S.sound==='mute') return;
    speak(en,'en-US');
    e.stopPropagation();
  };

  renderChallengeRings(i,'word-order',$('studyMCPrompt'));
  studyDontKnowAction=function(){
    if(locked) return; locked=true;
    addMastery(i,-0.2);
    studyPending.push({idx:i,mod:'word-order'});
    armTapAdvance($('studyMC'),function(){nextStudyCard();},1200);
  };
  renderWagerControl('studyMCActions',i);
}


/* ============ DEBUG: PROGRESS CONTROLS ============ */

function debugResetProgress(){
  showDebugModal(
    '⚠ RESET ALL PROGRESS',
    'Wipe all cards, XP, grammar progress, and history. Cannot be undone.',
    [
      {label:'RESET', danger:true, action:()=>{
        localStorage.removeItem(KEY);
        S={cards:{},xp:0,lastDay:null,streak:0,sound:S.sound||'auto',ordered:false,
           decks:{},activeDeck:'core',dailyCards:0,dailyDate:'',uniqueSeen:[],
           mult:1.0,multStreak:0,seenColls:[],grammarMastery:{},grammar:{}};
        initGrammarState();
        save();
        rollBg(); renderHome(); show('home');
      }},
      {label:'CANCEL', action:null}
    ]
  );
}

function debugSetProficiency(){
  showDebugModal(
    '◈ SET PROFICIENCY',
    'Simulate user at this progress level:',
    [
      {label:'0% — NEW USER',   action:()=>applyProficiency(0)},
      {label:'25% — BEGINNER',  action:()=>applyProficiency(25)},
      {label:'50% — MIDWAY',    action:()=>applyProficiency(50)},
      {label:'75% — ADVANCED',  action:()=>applyProficiency(75)},
      {label:'100% — MASTERED', action:()=>applyProficiency(100)},
      {label:'CANCEL', action:null}
    ]
  );
}

function applyProficiency(level2){

  // Reset first
  S.cards={}; S.xp=0; S.streak=0; S.uniqueSeen=[]; S.seenColls=[];
  S.grammar={}; S.grammarMastery={};
  initGrammarState();

  // Calculate how many words to introduce
  const wordCount=Math.round((level2/100)*D.length);
  const axisStageTarget=Math.round((level2/100)*5); // 0-5
  const grammarStageTarget=Math.round((level2/100)*4); // 0-4

  // Introduce words up to wordCount with appropriate mastery
  D.forEach((_,i)=>{
    if(i>=wordCount) return;
    const ci=card(i);
    ci.exp=Math.max(1, Math.round((level2/100)*5));
    ci.seen=true;
    ci.m=Math.round((level2/100)*4*10)/10;
    if(!ci.axisStage) ci.axisStage={pos:0,meaning:0};
    ci.axisStage.meaning=Math.min(5,axisStageTarget);
    ci.axisStage.pos=Math.min(4,Math.floor(axisStageTarget/2));
    if(!ci.axisReps) ci.axisReps={meaning:0,pos:0,tone:0};
    ci.axisReps.meaning=Math.round((level2/100)*20);
    if(!ci.axisDue) ci.axisDue={};
    // Cards are due now for review
    ci.axisDue.meaning=Date.now()-1000;
    ci.axisDue.pos=Date.now()-1000;
    if(!ci.axisHistory) ci.axisHistory={meaning:[],pos:[],tone:[]};
    // Simulate successful history
    const histLen=Math.round((level2/100)*15);
    ci.axisHistory.meaning=Array(histLen).fill(1);
    S.uniqueSeen.push(i);
  });

  // Set grammar stages
  GRAMMAR_CATS.forEach(cat=>{
    GRAMMAR_AXES.forEach(axis=>{
      if(S.grammar[cat]&&S.grammar[cat][axis]){
        S.grammar[cat][axis].stage=Math.min(AXIS_MAX_STAGES[axis]||4, grammarStageTarget);
        S.grammar[cat][axis].reps=Math.round((level2/100)*10);
        // Not due — already learned
        S.grammar[cat][axis].due=level>=50?Date.now()+7*DAY:Date.now()-1000;
        const histLen=Math.round((level2/100)*10);
        S.grammar[cat][axis].history=Array(histLen).fill(1);
      }
    });
  });

  S.xp=Math.round((level2/100)*50000);
  S.streak=Math.round((level2/100)*30);

  save();
  rollBg(); renderHome(); show('home');
}


function showDebugModal(title, body, buttons){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  const box=document.createElement('div');
  const fg=getComputedStyle(document.body).color;
  const bg=getComputedStyle(document.body).backgroundColor;
  box.style.cssText='background:'+bg+';color:'+fg+';border:4px solid '+fg+';padding:20px;width:100%;max-width:340px;display:flex;flex-direction:column;gap:12px;font-family:inherit;';
  const t=document.createElement('div');
  t.style.cssText='font-size:10px;letter-spacing:2px;font-weight:bold;';
  t.textContent=title;
  const b=document.createElement('div');
  b.style.cssText='font-size:9px;opacity:.7;line-height:1.6;';
  b.textContent=body;
  box.appendChild(t);
  box.appendChild(b);
  buttons.forEach(btn=>{
    const el=document.createElement('button');
    el.style.cssText='font-family:inherit;font-size:9px;padding:12px;border:3px solid '+(btn.danger?'hsl(0,70%,55%)':fg)+';color:'+(btn.danger?'hsl(0,70%,55%)':fg)+';background:transparent;cursor:pointer;letter-spacing:1px;';
    el.textContent=btn.label;
    el.onclick=()=>{ overlay.remove(); if(btn.action) btn.action(); };
    box.appendChild(el);
  });
  overlay.appendChild(box);
  overlay.onclick=(e)=>{ if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}


/* ============ SEMANTIC RELATIONS DATABASE ============ */
// Handcrafted for the 100-word Mandarin frequency spine.
// Priority for distractor selection:
//   1. opposites  — ontological opposites, highest learning signal
//   2. neighbors  — semantic field neighbors
//   3. functional — functional analogs (same grammatical role)
//
// Only characters that appear in D[] are useful distractors.

const SR={
  // ── PRONOUNS ──────────────────────────────────────────────────
  '我':{ op:['你','他','她'],    nb:['我们'],           fn:[] },
  '你':{ op:['我','他','她'],    nb:['你们'],           fn:[] },
  '他':{ op:['她','我','你'],    nb:['他们'],           fn:[] },
  '她':{ op:['他','我','你'],    nb:['她们'],           fn:[] },
  '们':{ op:[],                   nb:['我','你','他'],    fn:[] },
  '它':{ op:['我','你'],          nb:['他','她'],         fn:[] },

  // ── CORE VERBS ────────────────────────────────────────────────
  '是':{ op:['不','没'],          nb:['有','在'],         fn:['了','的'] },
  '有':{ op:['没','没有'],        nb:['是','在'],         fn:[] },
  '在':{ op:['没','不在'],        nb:['有','是'],         fn:['上','里','下'] },
  '来':{ op:['去','走'],          nb:['到','回'],         fn:['进','出'] },
  '去':{ op:['来','回'],          nb:['到','走'],         fn:['进','出'] },
  '说':{ op:[],                   nb:['讲','问','答'],    fn:['叫','喊'] },
  '知道':{ op:['不知道'],         nb:['明白','懂'],       fn:[] },
  '到':{ op:[],                   nb:['来','去','回'],    fn:['进','出'] },
  '要':{ op:['不要','不'],        nb:['想','会','能'],    fn:['该','得'] },
  '会':{ op:['不会'],             nb:['能','可以'],       fn:['该','要'] },
  '能':{ op:['不能'],             nb:['会','可以'],       fn:['该','要'] },
  '可以':{ op:['不可以','不能'],  nb:['能','会'],         fn:['该','要'] },
  '做':{ op:[],                   nb:['干','用','给'],    fn:['说','写'] },
  '看':{ op:[],                   nb:['见','听','想'],    fn:['读','写'] },
  '想':{ op:['不想'],             nb:['要','希望','觉得'],fn:['看','以为'] },
  '给':{ op:['要','拿'],          nb:['送','帮','让'],    fn:['用','拿'] },
  '让':{ op:[],                   nb:['给','帮','叫'],    fn:['要','说'] },
  '叫':{ op:[],                   nb:['说','让','请'],    fn:['问','告诉'] },
  '走':{ op:['来','停'],          nb:['去','跑','回'],    fn:['进','出'] },
  '回':{ op:['去','来'],          nb:['走','到'],         fn:['进','出'] },
  '打':{ op:[],                   nb:['用','拿','放'],    fn:['做','干'] },
  '开':{ op:['关'],               nb:['进','出','走'],    fn:['用','做'] },
  '关':{ op:['开'],               nb:['停','走'],         fn:['关','回'] },

  // ── STATIVE VERBS / ADJECTIVES ────────────────────────────────
  '好':{ op:['坏','不好'],        nb:['对','行'],         fn:['大','多'] },
  '大':{ op:['小'],               nb:['多','长','高'],    fn:['好','坏'] },
  '小':{ op:['大'],               nb:['少','短','低'],    fn:['好','坏'] },
  '多':{ op:['少'],               nb:['大','很'],         fn:[] },
  '少':{ op:['多'],               nb:['小','没'],         fn:[] },
  '对':{ op:['错','不对'],        nb:['好','行'],         fn:[] },
  '错':{ op:['对','没错'],        nb:['坏','不好'],       fn:[] },
  '新':{ op:['旧','老'],          nb:['好','年轻'],       fn:[] },
  '长':{ op:['短'],               nb:['大','高','多'],    fn:[] },

  // ── ADVERBS ───────────────────────────────────────────────────
  '不':{ op:['很','也','都'],     nb:['没','别'],         fn:['不','没'] },
  '没':{ op:['有','都'],          nb:['不','别'],         fn:['不'] },
  '也':{ op:[],                   nb:['都','还','又'],    fn:['不','很'] },
  '都':{ op:[],                   nb:['也','还','又'],    fn:['不','很'] },
  '很':{ op:['不','没'],          nb:['真','太','最'],    fn:['也','都'] },
  '还':{ op:[],                   nb:['也','都','又'],    fn:['不','很'] },
  '只':{ op:['都','全'],          nb:['就','才'],         fn:['不','没'] },
  '就':{ op:[],                   nb:['才','只','还'],    fn:['都','也'] },
  '才':{ op:['就'],               nb:['只','刚','又'],    fn:['都','也'] },
  '再':{ op:[],                   nb:['又','还','也'],    fn:['不','没'] },
  '又':{ op:[],                   nb:['再','还','也'],    fn:['都','也'] },
  '太':{ op:[],                   nb:['很','真','最'],    fn:['不','没'] },

  // ── PARTICLES ─────────────────────────────────────────────────
  '的':{ op:[],                   nb:['地','得'],         fn:['了','吗','呢','啊'] },
  '了':{ op:[],                   nb:['过','着'],         fn:['的','吗','呢'] },
  '吗':{ op:[],                   nb:['呢','啊','吧'],    fn:['的','了'] },
  '呢':{ op:[],                   nb:['吗','啊','吧'],    fn:['的','了'] },
  '吧':{ op:[],                   nb:['吗','呢','啊'],    fn:['的','了'] },

  // ── DEMONSTRATIVES ───────────────────────────────────────────
  '这':{ op:['那'],               nb:['这里','这个'],     fn:['什么','哪'] },
  '那':{ op:['这'],               nb:['那里','那个'],     fn:['什么','哪'] },

  // ── QUESTION WORDS ───────────────────────────────────────────
  '什么':{ op:[],                 nb:['哪','谁','怎么'],  fn:['这','那'] },

  // ── CONJUNCTIONS / CONNECTORS ─────────────────────────────────
  '和':{ op:[],                   nb:['跟','与','或'],    fn:['也','都'] },
  '但':{ op:['和','所以'],        nb:['可是','虽然'],     fn:['就','才'] },
  '所以':{ op:['但','虽然'],      nb:['因为','就'],       fn:['才','还'] },
  '因为':{ op:['所以'],           nb:['由于'],            fn:['就','才'] },
  '如果':{ op:[],                 nb:['要是','假如'],     fn:['就','才'] },
  '虽然':{ op:['所以'],           nb:['但是','可是'],     fn:['就','才'] },

  // ── POSITIONAL ───────────────────────────────────────────────
