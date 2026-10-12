export const HOUSE_RULES=[
 {title:'家族宗旨',rules:[
 ['家族荣誉',['湖南曾家重视家族传承、内部秩序与成员团结。曾家奴才应以获得家族认可为荣，以维护家族声誉为己任。']],
 ['入家为荣',['加入曾家是一份需要认真对待的身份承诺。凡自愿成为曾家奴才者，无论身份、背景、侍奉方式及职责差异，均应珍惜获得的家族身份，以忠诚和行动证明自身价值。']],
 ['家族利益',['奴才应将维护曾家声誉、尊重曾家成员及履行约定职责作为重要原则。在自愿承担的服务范围内，优先考虑曾家成员的合理需求，不得以个人任性或失信行为损害家族利益。']]
 ]},
 {title:'身份与等级',rules:[
 ['主仆有序',['曾家实行明确的主仆角色等级。曾家成员享有其约定角色中的主导地位，奴才应遵守相应的礼仪、称谓和服务规范。']],
 ['身份认同',['奴才应充分理解并认同自身选择的侍奉身份。在角色关系中，可以象征性地放下个人傲慢、虚荣与身份优越感，以谦卑、服从和尊敬体现对曾家的忠诚。']],
 ['一体适用',['本家规适用于所有自愿加入曾家主仆体系的奴才，包括但不限于狗奴、供奉奴、挡灾奴及其他约定身份。','不同身份可以具有不同的服务内容，但均须遵守统一的家族原则。任何身份均不意味着现实中的人格丧失、财产被剥夺或承担身体伤害。']]
 ]},
 {title:'忠诚与侍奉',rules:[
 ['忠诚原则',['忠诚是曾家奴才最重要的品格之一。奴才应当尊重曾家、信守承诺，不得恶意诋毁家族、泄露成员隐私或故意损害家族声誉。']],
 ['侍奉精神',['奴才应以能够为曾家提供服务为荣，不因职责大小而轻视自身身份，也不因付出而自认为高于其他成员。']],
 ['奉献意识',['奴才应在自身能力和自愿约定的范围内，为曾家提供时间、劳动、物品或其他形式的支持。任何财物供奉必须自愿、明确且合法，不得以忠诚为由强制索取。']],
 ['服从与纪律',['在双方认可的角色关系和约定范围内，奴才应认真执行合理指示，遵守家族活动纪律，不得随意违背已作出的承诺。']],
 ['家族优先',['当个人偏好与已承诺的家族服务发生冲突时，奴才应尽力履行承诺，主动沟通并妥善协调。任何家族要求均不得凌驾于成员的人身安全、基本权利和法律义务之上。']]
 ]},
 {title:'行为规范',rules:[
 ['尊重主家',['奴才应使用双方认可的称谓，以恭敬、礼貌的态度对待曾家成员，不得故意冒犯、挑衅或破坏正常的主仆秩序。']],
 ['谨言慎行',['奴才应维护曾家的整体形象，尊重内部隐私，不得未经允许公开其他成员的个人资料、照片或私人事务。']],
 ['责任担当',['奴才应对自身承诺负责，不推诿、不欺骗、不恶意失约。遇到无法履行的职责，应及时说明情况。']],
 ['角色边界',['所有主仆活动均须建立在成年人自愿、知情同意和明确边界的基础上。不得要求奴才以自伤、替他人承受伤害、承担非法责任或放弃基本生活保障的方式证明忠诚。']]
 ]}
];
export const FAMILY_OATH=[
 '我自愿加入湖南曾家，以获得曾家的认可与接纳为荣。',
 '自入家之日起，我愿在所选择的主仆角色中放下傲慢与虚荣，谨记自身身份，尊重家族等级与礼仪。',
 '我愿以忠诚为信念，以侍奉为荣誉，以守信为准则。',
 '我将珍惜曾家赋予我的角色身份，认真履行自愿承担的职责，以实际行动维护曾家的声誉、团结与利益。',
 '无论承担何种侍奉角色，我都愿恪守约定，不因职责平凡而懈怠，不因付出辛劳而轻慢承诺。'
];
export function houseRulesHtml(){
 let number=0;const chapters=['一','二','三','四','五'],ordinals=['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五'];
 return `<div class="house-rules"><section class="rules-cover"><span class="rules-edition">ZENG LEGACY｜曾氏传承</span><h2>湖南曾家家规</h2><p>家族至上 · 忠诚为本 · 侍奉为荣</p><div class="rules-cover-line"></div><small>五章 · 十五条 · 入家誓言</small></section>${HOUSE_RULES.map((chapter,index)=>`<section class="rules-chapter" aria-labelledby="rules-chapter-${index}"><header class="rules-chapter-heading"><span>${chapters[index]}</span><h3 id="rules-chapter-${index}">${chapter.title}</h3></header><ol start="${number+1}" class="rules-list">${chapter.rules.map(([title,body])=>`<li><span class="rule-number">${String(number+1).padStart(2,'0')}</span><div><h4>第${ordinals[number++]}条｜${title}</h4>${body.map(text=>'<p>'+text+'</p>').join('')}</div></li>`).join('')}</ol></section>`).join('')}<section class="rules-chapter rules-oath" aria-labelledby="rules-chapter-4"><header class="rules-chapter-heading"><span>五</span><h3 id="rules-chapter-4">入家誓言</h3></header><p class="rules-oath-intro">凡自愿加入曾家的奴才，可以通过以下誓言表达对家族的认同：</p><h4>曾家奴才忠诚誓言</h4><blockquote>${FAMILY_OATH.map(text=>'<p>'+text+'</p>').join('')}<p><strong>入曾家之门，守曾家之规。</strong></p><p><strong>以侍奉为荣，以忠诚为本。</strong></p></blockquote></section><div class="rules-signoff"><strong>ZENG LEGACY</strong><span>曾氏 · 家规</span><em>传承不息 · 荣耀永续</em></div></div>`;
}
