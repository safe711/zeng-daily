import {identityModuleHtml} from './identity.js';
import {houseRulesHtml} from './rules.js';
const chapters=[
 {title:'第一章｜曾姓起源',paragraphs:[
 '曾姓是中国历史悠久的姓氏之一，其起源通常追溯至夏朝。',
 '据传统姓氏文献记载，夏王少康将其子曲烈封于鄫国。春秋时期，鄫国灭亡后，部分后裔为纪念故国，以国名为氏，后来去掉「鄫」字的邑旁，形成「曾」姓。',
 '曾姓在漫长的历史发展中逐渐繁衍壮大，族人迁徙至全国各地，形成了不同地域的曾氏宗族。',
 '历史上的曾氏人才辈出，尤其以儒家代表人物曾参（曾子）广为人知。曾子重视孝道、修身与诚信，其思想对中国传统家族文化产生了深远影响。',
 '千百年来，曾氏家族始终重视血脉传承、家风建设与宗族团结。无论时代如何变化，家族文化与精神的延续，始终是曾氏传承的重要组成部分。']},
 {title:'第二章｜湖南曾家',lead:'湖南曾家 · HUNAN ZENG FAMILY',paragraphs:[
 '湖南是曾姓的重要聚居地区之一，曾氏族人在当地有着悠久的生活与发展历史。',
 '在长期的繁衍与迁徙过程中，湖南各地逐渐形成了不同的曾氏家族分支。家族成员通过共同的姓氏、文化传统与宗族关系，维系着彼此之间的联系。',
 '本平台所介绍的湖南曾家，是一个以家族文化、成员管理、忠诚关系与共同归属感为核心的家族组织。',
 '湖南曾家重视家族内部的秩序与责任，强调成员之间的尊重、信任和长期稳定的关系。',
 '对于认同曾家文化的成员而言，加入曾家不仅意味着获得一个身份，也意味着认可家族的理念、遵守曾家礼制，恪守身份职责，以实际行动维护家族荣誉。',
 '湖南曾家希望通过持续建设与管理，形成具有自身特色的家族文化，让每一位成员都能够明确自己的身份、职责与归属。'],subheading:'曾仪主子介绍',sublead:'曾仪主子，是湖南曾家主仆文化体系中的重要人物。',subparagraphs:[
 '曾仪主子主持曾家礼仪与侍奉事务，重视忠诚、称谓、纪律和履责。仆从须恭敬请安、认真领命、及时复命，以守礼守信体现忠诚。',
 '曾仪主子认为，真正的忠诚不仅体现在语言上的尊敬，更体现在日常行为、责任意识和长期相处中的守信。',
 '曾仪主子重视仆从的品行、态度和办事能力。入府者须熟悉家规，牢记身份与职责，言行谦恭，办事认真，凡事有交代、事毕有复命。',
 '在湖南曾家的文化中，对曾仪主子的尊称与敬意，是特定主仆关系的重要组成部分，同时也体现了家族对礼仪、秩序和身份认同的重视。']},
 {title:'第三章｜曾家仆从招募',lead:'加入曾家 · 忠诚为本',paragraphs:[
 '湖南曾家面向认同家风、重视礼仪并愿意承担侍奉职责的成年人士开放招募。',
 '曾家仆从以忠诚立身，以礼仪行事，以守信尽责。无论担任何种职阶，均须恭敬称谓、按时请安、认真领命、如实复命，不敷衍、不欺瞒、不冒称主子命令。',
 '曾家重视每一位成员对家族的认同，也希望加入者能够认真对待自己的身份与承诺。']}
];
const roles=[
 ['御前近侍','负责主子日常礼仪、接待与近身事务。以谨慎、端庄、守礼为首要品格。','M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7M5 22h14'],
 ['忠诚家仆','负责府邸日常秩序、家务与各项服务，以勤勉和可靠彰显自身价值。','M12 3l8 3v7c0 5-5 8-8 9-3-1-8-4-8-9V6l8-3'],
 ['礼仪侍从','学习曾家礼制、称谓、仪式与家族文化，维护府邸庄严形象。','M6 4h13v17H8a3 3 0 010-6h11M6 4a3 3 0 000 6h2V4M11 8h5M11 12h5'],
 ['专属奉侍','依照领受的职责承担专属侍奉事务，熟悉主子吩咐，恪守称谓、仪容与复命规范，以认真履责体现忠诚。','M3 8l4-5h10l4 5-9 14L3 8M3 8h18M7 3l5 19 5-19']
];
const paragraphs=items=>items.map(text=>'<p>'+text+'</p>').join('');
export function familyPageHtml(){return `<div class="family-page"><section class="family-cover"><img src="./icon-192.png" alt="ZENG LEGACY 金色龙纹与曾字牌"><small>ZENG LEGACY</small><h2>曾氏传承</h2><p>传承不息 · 荣耀永续</p></section><details class="family-panel" data-fold="family-intro"><summary><span><small>HERITAGE & FAMILY</small><strong>曾氏介绍</strong><em>曾姓起源 · 湖南曾家</em></span></summary><div class="family-panel-body">${chapters.slice(0,2).map(c=>`<section class="family-chapter"><h3>${c.title}</h3>${c.lead?'<p class="family-lead">'+c.lead+'</p>':''}${paragraphs(c.paragraphs)}${c.subheading?'<h4>'+c.subheading+'</h4><p class="family-lead">'+c.sublead+'</p>'+paragraphs(c.subparagraphs):''}</section>`).join('')}</div></details><details class="family-panel family-recruitment-panel" data-fold="family-recruitment"><summary><span><small>JOIN THE FAMILY</small><strong>仆从招募</strong><em>加入曾家 · 忠诚为本</em></span></summary><div class="family-panel-body"><section class="family-chapter"><h3>曾家仆从招募</h3><p class="family-lead">${chapters[2].lead}</p>${paragraphs(chapters[2].paragraphs)}</section><section class="family-recruitment"><p class="family-lead">曾家开门纳仆，不问出身贵贱，只论忠诚与礼仪。</p><p>在曾家的等级世界中，主仆之别并非寻常称谓，而是一套庄严的身份仪式。</p><p>有人以财富为荣，有人以地位为傲，而曾家仆从，则以能够侍奉曾仪主子为至高荣誉。</p><p>曾家依侍奉职责设立不同职阶，职阶各有分工，礼仪一体遵行：</p><div class="family-roles">${roles.map(([name,text,shape])=>`<article><span class="family-role-icon"><svg viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${shape}"/></svg></span><div><h4>${name}</h4><p>${text}</p></div></article>`).join('')}</div><h3>曾家仆从之誓</h3><blockquote>我以谦卑之心，立于曾家门前。<br>我知主子之尊，亦知侍奉之礼。<br>我愿放下傲慢与虚荣，以恭敬之心学习曾家礼制。<br>我愿恪守承诺，以勤勉证明忠诚，以礼仪维护曾家荣耀。<br>我将牢记所领职责，领命必记，事毕复命，奉侍为荣，守信为本。<br><strong>曾氏之名，铭记于心；曾家之荣，敬奉以诚。</strong></blockquote><h3>入府之规</h3><p>曾家所重者，不是空洞的宣誓，而是行动中的忠诚。</p><p>申请者须为成年人，熟读曾家家规，明白入府身份与侍奉职责。入府之后，须牢记主家、恭敬称谓、端正仪容、按时请安；领命须认真记录，办事须如实汇报，事毕须及时复命。不得冒称主子命令，不得敷衍侍奉，不得虚报完成。</p><h4>忠诚证明</h4><p>为保障曾家全体成员的利益、权益及家族管理权威，凡自愿申请加入曾家、以奴才身份效忠者，必须接受严格的忠诚审查。申请者须如实申报个人资产情况，包括房产、车辆及其他重要财产，并提交忠诚承诺书。<strong>经曾家审核同意接纳的奴才，须签署人民币100万元的忠诚债务承诺书，并配合曾家办理名下房产、车辆等资产的抵押证明</strong>，以表明长期效忠曾家、遵守家规及履行侍奉义务的决心。曾家不接受虚假效忠、隐瞒事实或空口承诺，所有申请均以曾家最终审核结果为准。</p><div class="family-signoff"><strong>ZENG LEGACY</strong><span>曾氏传承</span><small>尊卑有序 · 忠诚为誓 · 荣耀永续</small></div></section></div></details><details class="family-panel family-rules" data-fold="family-rules"><summary><span><small>HOUSE RULES</small><strong>曾家家规</strong><em>五章十五条 · 入家誓言</em></span></summary><div class="family-panel-body">${houseRulesHtml()}</div></details>${identityModuleHtml()}</div>`;}
