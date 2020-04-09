file_order = {}
let pgb_initialize = function(files){
    $('#progress_bar').empty()
    
    tag_txt = {}
    style_txt = {}
    num = files.length
    tag_base = '<div class="progress"><div id= class=\"progress-bar progress-bar-striped progress-bar-animated\" role=\"progressbar\" aria-valuenow= aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: >text</div></div>'
    p1 = /id=/
    p2 = /aria-valuenow=/
    p3 = /width:/
    p4 = /text/
        
    for(i=0;i<num;i++){
        file_name = files[i].name
        file_order[file_name] = i
        pgb_string = 'pgb_'+String(i)
        tag_replaced = tag_base.replace(p1,'id='+pgb_string).replace(p2,'aria-valuenow=\"'+parseInt(0)+'\"').replace(p3,'width: '+parseInt(0)+'%\"').replace(p4,parseInt(0)+'%')
        tag_txt[file_name] = '<p>'+file_name+'</p>'+tag_replaced
    }
    Object.keys(tag_txt).forEach(function(key) {
        var val_pgb = tag_txt[key]; // this は obj
        $('#progress_bar').append(val_pgb)
    })
}
/*
let pgb_initialize = function(files){
    tag_txt = {}
    style_txt = {}
    num = files.length
    for(i=0;i<num;i++){
        file_name = files[i].name
        file_order[file_name] = i
        tag_txt[file_name] = '<p>'+file_name+'</p><div id=\"pgb_'+String(i)+'\">'+'<div id=\"lbl_'+String(i)+'\"></div>'+'</div>'
        style_txt[file_name] = '<style type=\"text/css\">#lbl_'+String(i)+'{position: absolute;left: 50%;}</style>'
    }
    
    
    
    Object.keys(tag_txt).forEach(function(key) {
        var val_pgb = this[key]; // this は obj
        var val_body = style_txt[key]
        $('#progress_bar').append(val_pgb)
        $('#body_id').append(val_body)
        pgb_tag = '#pgb_'+file_order[key]
        lbl_tag = '#lbl_'+file_order[key]

        $(pgb_tag).progressbar({
            value: 0,
            max:100,
            change: function(){
                    lbl_tag = pgb_tag.replace(/pgb/,'lbl')
                    var v = $(pgb_tag).progressbar("value");
                    var txt = $(lbl_tag).text()
                    var pattern = /^(\d+)\%/
                    current_v = txt.match(pattern)
                    
                    if(current_v != null){
                        if(v >= current_v[1]){
                            $(lbl_tag).text(v + "%");
                        }
                    }else{
                        $(lbl_tag).text(v + "%")
                    }
                },
                complete: function(){
                    lbl_tag = pgb_tag.replace(/pgb/,'lbl')
                    $(lbl_tag).text("Completed");
                    console.log(key,' Completed')
                }
            })
        }, tag_txt)         
    
}
*/
let pgb_update = function(p,file_name){
    pgb_tag = '#pgb_'+file_order[file_name]
    //console.log('in pgb_update',p,file_name)
    $(pgb_tag).css('width',String(p)+'%')
    $(pgb_tag).attr('aria-valuenow',String(p))
    $(pgb_tag).text(String(p)+'%')
}
let progress_window = function(){
    child = window.open('progress.html','_blank','width=500,height=500,scrollbars=1,location=0,menubar=0,toolbar=0,status=1,directories=0,resizable=1,left='+(window.screen.width-500)/2+',top='+(window.screen.height-500)/2)
}

let all_select = function(){
    $('input[name=r_chk]').prop('checked',this.checked)
}
  
let ind_select = function(){
    if ($('#object_list :checked').length == $('#object_list :input').length) {
        // 全てのチェックボックスにチェックが入っていたら、「全選択」 = checked  
        $('#all_checks').prop('checked', true);
    } else {
        // 1つでもチェックが入っていたら、「全選択」 = checked
        $('#all_checks').prop('checked', false);
    }
}

let createbody = function(txt,items){
    
    items.forEach(function(item){
        txt += item + '</td><td>'
    })
    txt = txt.slice(0,-4)+'</tr>'
    return txt
}

let convertByteSize = function(size) {
    var sizes =[' B', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB'];
    var ext = sizes[0];
    if(typeof size==='number'){
        for (var i=1;i< sizes.length;i+=1){
            if(size>= 1024){
            size = size / 1024;
            ext = sizes[i];
            }
        }
    }
    return Math.round(size*100)/100+ext;
}

let generateUuid = function(){
    // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
    // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
    for (let i = 0, len = chars.length; i < len; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
}

let open_modal = function(file_num){
    height = file_num * 80 + 160
    $('.modal-content').css('height',String(height)+'px')
    $('#progress_modal').modal('show')
    
/*
    var timer = setInterval(function(){
        v = parseInt($('#pgb').attr('aria-valuenow'))
        v += 5
        console.log(v)
        $('#pgb')
            .css('width', v + '%')
            .attr('aria-valuenow', v)
            .text(v + '%')
    },500)*/
}

let dispLoading = function(msg){
    // 引数なし（メッセージなし）を許容
    if( msg == undefined ){
      msg = "";
    }
    // 画面表示メッセージ
    var dispMsg = "<div class='loadingMsg'>" + msg + "</div>";
    // ローディング画像が表示されていない場合のみ出力
    if($("#loading").length == 0){
      $("body").append("<div id='loading'>" + dispMsg + "</div>");
    }
}

let removeLoading = function(){
    $("#loading").remove();
  }
let test = function(){
    $.ajax({type:'get',url:'/api/v1/test/',
        success:function(j){
            date = new Date()
            console.log(parseInt(date.getTime()/1000).toFixed(0))
            console.log(j)
        }
    })
}

let test1 = function(){
    var data = [[1,"a",5,10],[1,"b",15,30],[1,"c",5,20],[1,"d",5,20]]
    $('#object_table').DataTable().ajax.reload()
}