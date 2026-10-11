export const HOUSE_RULES=[
  {title:'身份规矩',rules:[
    ['主子第一。','狗奴必须牢记自己的角色身份。在所有主仆礼仪中，曾仪主子永远排在第一位。'],
    ['称呼要守规矩。','正式请安、汇报和复命时，必须称呼“主子”，自称“狗奴”或“奴才”。'],
    ['不许擅自替主子做决定。','没有明确安排的事情，不得谎称是主子的命令。'],
    ['赏赐不能主动索要。','主子给予的任何角色赏赐，都要认真记录并表达感谢，不得视为理所当然。']
  ]},
  {title:'每日礼仪',rules:[
    ['早晚请安。','每天早晨和睡前完成跪拜、磕头及请安仪式，并在日课中打卡。'],
    ['每日诵训。','每天至少宣读一次忠诚誓词，不得敷衍。'],
    ['每日敬亲。','每天向曾家长辈表达祝福，并完成象征性的敬亲仪式。'],
    ['每日自省。','睡前检查当天有没有漏掉礼仪、违反约定或虚报完成情况。']
  ]},
  {title:'侍奉规矩',rules:[
    ['主动侍奉。','狗奴应主动留意主子的实际需要，不必每件小事都等待提醒。'],
    ['有令必记。','主子明确安排的任务，要记录内容、时间和完成情况。'],
    ['不许敷衍。','已经接受的任务必须认真对待。无法完成时，应如实说明，不得假装完成。'],
    ['礼仪与任务分开。','每日礼仪固定执行。洗鞋等侍奉事项只在实际需要时执行，不作为每日固定任务。']
  ]},
  {title:'奉献规矩',rules:[
    ['以奉献为荣。','狗奴在角色扮演中以克制享受、主动为曾家着想作为忠诚表现。'],
    ['供奉主动登记。','自愿安排的供奉可以记录在专门档案中，不得虚报金额或完成情况。'],
    ['虚拟财产归属。','在文字游戏的身份设定中，狗奴只保留基本生活份额，其余虚拟资源归曾家所有。现实财务不按游戏积分自动转移。']
  ]},
  {title:'考核与奖惩',rules:[
    ['按时完成，给予嘉奖。','认真完成每日礼仪、履行已有约定，可以获得忠诚积分。'],
    ['漏礼必须补报。','遗漏礼仪要如实登记，并在方便时补做，不得伪造打卡。'],
    ['违令给予警告。','违反已经确认的角色规矩，记录一次警告，并要求说明原因。'],
    ['不得私自加戏。','主子没有提出的要求，不得自行编造，更不得冒充主子的评价。'],
    ['每天必须复命。','睡前提交当日礼仪、侍奉任务和奖惩记录，完成当天日课。']
  ]}
];
export const DAILY_WORDS='狗奴牢记身份，曾家为尊。每天认真守礼，主动侍奉，不虚报、不敷衍。做得好接受嘉奖，做得不好如实认错、认真改正。';
export function houseRulesHtml(){
  let number=0;const chapters=['一','二','三','四','五'];
  return `<div class="house-rules"><section class="rules-cover"><span class="rules-edition">第一版</span><h2>《曾家家规》</h2><p>狗奴日常管理条例</p><div class="rules-cover-line"></div><small>五章 · 二十条</small></section>${HOUSE_RULES.map((chapter,index)=>`<section class="rules-chapter" aria-labelledby="rules-chapter-${index}"><header class="rules-chapter-heading"><span>${chapters[index]}</span><h3 id="rules-chapter-${index}">${chapter.title}</h3></header><ol start="${number+1}" class="rules-list">${chapter.rules.map(([title,body])=>`<li><span class="rule-number">${String(++number).padStart(2,'0')}</span><div><h4>第${number}条：${title}</h4><p>${body}</p></div></li>`).join('')}</ol></section>`).join('')}<section class="rules-daily"><small>每日训词</small><blockquote>“${DAILY_WORDS}”</blockquote></section><p class="rules-footnote"><em>本家规用于自愿的私人角色扮演与日课管理。</em></p></div>`;
}
