export const HOUSE_RULES=[
 {title:'家族宗旨',rules:[
 ['家族荣誉',['湖南曾家重视家族传承、内部秩序与成员团结。曾家奴才应以获得家族认可为荣，以维护家族声誉为己任。']],
 ['入家为荣',['加入曾家是一份需要认真对待的身份承诺。凡自愿成为曾家奴才者，无论身份、背景、侍奉方式及职责差异，均应珍惜获得的家族身份，以忠诚和行动证明自身价值。']],
 ['家族利益',['奴才应将维护曾家声誉、尊重曾家成员及履行约定职责作为重要原则。应认真履行所领职责，留意主家所需，主动报告进展，不得因任性、怠慢或失信损害家族声誉。']]
 ]},
 {title:'身份与等级',rules:[
 ['主仆有序',['曾家主仆有序，称谓有别，礼仪有章。奴才须尊敬主家，守好身份次序，依家规完成请安、领命、侍奉与复命。']],
 ['身份认同',['奴才须牢记入府身份，知礼守分，言行谦恭。不得以傲慢、虚荣或自夸轻慢侍奉；应以认真办事、恭敬请安和如实复命体现忠诚。']],
 ['一体适用',['本家规适用于曾家各类奴才，包括狗奴、供奉奴、挡灾奴及其他登记身份。','各类身份依职责分工侍奉，均须遵守同一套称谓、礼仪、诚信与复命规矩。职阶不同，不得成为失礼、怠慢或虚报的借口。']]
 ]},
 {title:'忠诚与侍奉',rules:[
 ['忠诚原则',['忠诚是曾家奴才最重要的品格之一。奴才应当尊重曾家、信守承诺，不得恶意诋毁家族、泄露成员隐私或故意损害家族声誉。']],
 ['侍奉精神',['奴才应以能够为曾家提供服务为荣，不因职责大小而轻视自身身份，也不因付出而自认为高于其他成员。']],
 ['奉献意识',['奴才应勤勉侍奉，珍惜所领职责，认真安排时间、劳动与供奉。供奉事项须登记清楚，记录内容、日期与完成情况，不得虚报，不得以空口承诺冒充实际奉献。']],
 ['服从与纪律',['奴才须认真领受主子吩咐，记清内容与期限，依次办理并及时复命。遇到不能完成的事项，应立即说明，不得擅自改令、假装完成或隐瞒延误。']],
 ['家族优先',['凡已领受的侍奉事项，须安排妥当，按时履行。遇到行程或事务冲突，应提前禀明并妥善协调，不得无故缺席，不得失约后推诿。']]
 ]},
 {title:'行为规范',rules:[
 ['尊重主家',['奴才应使用双方认可的称谓，以恭敬、礼貌的态度对待曾家成员，不得故意冒犯、挑衅或破坏正常的主仆秩序。']],
 ['谨言慎行',['奴才应维护曾家的整体形象，尊重内部隐私，不得未经允许公开其他成员的个人资料、照片或私人事务。']],
 ['责任担当',['奴才应对自身承诺负责，不推诿、不欺骗、不恶意失约。遇到无法履行的职责，应及时说明情况。']],
 ['礼仪分寸',['礼有次序，行有分寸。请安须端正，领命须听清，侍奉须认真，复命须如实。不得擅自加戏、冒传命令或以伤身逞强代替尽责；忠诚以守礼和行动为证。']]
 ]}
];
export const FAMILY_OATH=[
 '我自愿加入湖南曾家，以获得曾家的认可与接纳为荣。',
 '自入家之日起，我愿放下傲慢与虚荣，谨记自身身份，恭敬主家，遵行曾家礼仪。',
 '我愿以忠诚为信念，以侍奉为荣誉，以守信为准则。',
 '我将珍惜曾家赋予我的入府身份，认真履行所领职责，以实际行动维护曾家的声誉、团结与利益。',
 '无论担任何种侍奉职阶，我都愿守礼尽责，不因事务平凡而懈怠，不因付出辛劳而轻慢承诺。'
];
export function houseRulesHtml(){
 let number=0;const chapters=['一','二','三','四','五'],ordinals=['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五'];
 return `<div class="house-rules"><section class="rules-cover"><span class="rules-edition">ZENG LEGACY｜曾氏传承</span><h2>湖南曾家家规</h2><p>家族至上 · 忠诚为本 · 侍奉为荣</p><div class="rules-cover-line"></div><small>五章 · 十五条 · 入家誓言</small></section>${HOUSE_RULES.map((chapter,index)=>`<section class="rules-chapter" aria-labelledby="rules-chapter-${index}"><header class="rules-chapter-heading"><span>${chapters[index]}</span><h3 id="rules-chapter-${index}">${chapter.title}</h3></header><ol start="${number+1}" class="rules-list">${chapter.rules.map(([title,body])=>`<li><span class="rule-number">${String(number+1).padStart(2,'0')}</span><div><h4>第${ordinals[number++]}条｜${title}</h4>${body.map(text=>'<p>'+text+'</p>').join('')}</div></li>`).join('')}</ol></section>`).join('')}<section class="rules-chapter rules-oath" aria-labelledby="rules-chapter-4"><header class="rules-chapter-heading"><span>五</span><h3 id="rules-chapter-4">入家誓言</h3></header><p class="rules-oath-intro">凡自愿加入曾家的奴才，可以通过以下誓言表达对家族的认同：</p><h4>曾家奴才忠诚誓言</h4><blockquote>${FAMILY_OATH.map(text=>'<p>'+text+'</p>').join('')}<p><strong>入曾家之门，守曾家之规。</strong></p><p><strong>以侍奉为荣，以忠诚为本。</strong></p></blockquote></section><div class="rules-signoff"><strong>ZENG LEGACY</strong><span>曾氏 · 家规</span><em>传承不息 · 荣耀永续</em></div></div>`;
}
