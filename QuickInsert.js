/*<pre>
	该插件来自一个很厉害的萌娘百科用户：User:九江月。
	载入后将在编辑页面的编辑栏下方载入快捷生成代码的按钮，如果你想自己对按钮进行定制，需要将该文件复制到你自己的用户js页面中。
	通过在下方所示的charsets数组中添加按钮信息的对象，生成按钮。
	其中，【{start:"", end:"", text:"string"}】这样只填text将生成只有显示文本无效的按钮，可以用于提示分类；【{text:"<br/>"}】可以用于换行。
*/
$(document).ready( function() {
    if($("#specialchars").length>0){
    var charsets = [
    // 在这里插入魔术字，start是光标前文本，end是光标后文本，text是显示文本
    {start:"", end:"", text:"歌曲词条："},
    {start:"{{LyricsKai|lstyle=color: ;|rstyle=color: ;|reserveWidth=260px\n|original=\n", end:"\n|translated=\n\n}}", text:"【歌词】"},
    {start:"{{Infobox Song\n|歌曲名= ", end:"\n|image= \n|图片信息= 专辑封面\n|演唱= \n|作詞= \n|作曲= \n|編曲= \n|时长= \n|收錄專輯= {{lj| }}\n|标题颜色=\n|左栏颜色=\n|底栏颜色=\n}}", text:"【歌曲信息】"},
    {start:"{{Album Infobox\n|专辑名称     = '''  '''\n|image        = \n|图片大小     = 280px\n|图片信息     = 专辑封面\n|tabs         = \n|原名         = {{lj|  }}\n|出品         = \n|封面设计     = \n|发行         = \n|发行地区     = 日本\n|发行日期     = 2017年12月6日\n|系列         = \n|专辑类型     = \n|年表         = \n}}", end:"", text:"【专辑信息】"},
    {start:"{{Tracklist\n| headline        = \n| all_music       = \n| all_lyrics      = \n| longnote_column = no\n| title1       = '''{{lj|[[  Song1  |  ソング1  ]]}}'''\n| length1      = \n| title2       = '''{{lj|[[  Song2  |  ソング2  ]]}}'''\n| length2      = \n| title3       = '''{{lj|[[  Song3  |  ソング3  ]]}}'''\n| length3      = \n| title4       = '''{{lj|ソング1(Instrumental)}}'''\n| length4      = \n| title5       = '''{{lj|ソング2(Instrumental)}}'''\n| length5      = \n| title6       = '''{{lj|ソング3(off vocal)}}'''\n| length6      = \n}}", end:"", text:"【专辑列表】"},
    {text:"<br/>"},
    {start:"{{unsigned|", end:"}}", text:"【未签名提示】"},
    {start:"#REDIRECT [[", end:"]]", text:"【重定向】"},
    {start:"<includeonly><!--\n-->", end:"\n<!--\n--></includeonly><noinclude>\n\n</noinclude>", text:"【模板】"},
    {start:"<references />", end:"", text:"【ref标签】"},
    {text:"<br/>"},
    {start:"{{#fornumargs: num | value\n|", end:"\n}}", text:"【fornumargs】"},
    {start:"{{#invoke:String|replace|source= ", end:"|pattern= |replace= |count=1|plain=false}}", text:"【正则replace】"},
    {start:"{{#invoke:String|match|s= ", end:"|pattern= |match=1|plain=false|ignore_errors=true}}", text:"【正则match】"},
    {text:"<br/>"},
    {start:"", end:"", text:"分类页面："},
    {start:"{{Catnav|人物|现实人物|各国人物|日本人}}{{Catmore}}[[分类:按声优分类]][[分类:日本人]]", end:"", text:"【声优】"},
    {start:"{{catnav|音乐|歌曲|各演出者歌曲}}[[分类:各演出者歌曲]]{{Catmore|", end:"}}", text:"【演出者歌曲】"},
    {start:"{{subst:MarkAsResolved/auto|status=r|comment=",end:"}}",text:"MAR 问题已解决"},
    {start:"{{subst:MarkAsResolved/auto|status=p|comment=",end:"}}",text:"MAR 问题已答复"},
    {start:"{{subst:MarkAsResolved/auto|status=n|comment=",end:"}}",text:"MAR 无人回复"},
    ];
    if($('#mycharinsert').length<=0){$("#specialchars").prepend("<p id='mycharinsert'></p>");}
    for(var i in charsets){
    var label={};if(charsets[i].text=="<br/>"){label = document.createElement('br');}else{label = document.createElement('a');label.setAttribute("class","mw-charinsert-item");label.setAttribute("href","#");label.setAttribute("data-mw-charinsert-start",charsets[i].start);
    label.setAttribute("data-mw-charinsert-end",charsets[i].end);label.innerHTML=charsets[i].text;}
    $('#mycharinsert').append(label);}
    //this code picked from mw.ext.charinsert
    (function($,mw){
    var addClickHandlers = function ( $content ) {
    $content.find('a.mw-charinsert-item' ).each( function () {
    var $elm = $( this ),start = $elm.data( 'mw-charinsert-start' ),end = $elm.data( 'mw-charinsert-end' );
    if ( $elm.data( 'mw-charinsert-done' ) ) {return;}
    $elm.click(function(e){e.preventDefault();mw.toolbar.insertTags( start, end, '' );}).data( 'mw-charinsert-done', true ).attr( 'href', '#' );});};
    $(function(){addClickHandlers( $( document ) );});
    mw.hook('wikipage.content').add( addClickHandlers );
    })(jQuery,mediaWiki);}
    });//</pre>