file_order = {}
let pgb_initialize = function(files){
    tag_txt = {}
    style_txt = {}
    num = files.length
    for(i=0;i<num;i++){
        file_name = files[i].name
        file_order[file_name] = i
        tag_txt[file_name] = '<p>'+file_name+'</p><div id=\"pgb_'+String(i)+'\">'+'<div id=\"lbl_'+String(i)+'\"></div>'+'</div>'
        style_txt[file_name] = '<style type=\"text/css\">#lbl_'+String(i)+'{position: absolute;left: 50%;}</style>'
        
        //console.log(tag_txt[file_name])
    }
    
    progress_window()
    child.onload = function(){
        Object.keys(tag_txt).forEach(function(key) {
            var val_pgb = this[key]; // this は obj
            var val_body = style_txt[key]
            //console.log(key, val_pgb,val_body);
            $('#progress_bar',child.document).append(val_pgb)
            $('#body_id',child.document).append(val_body)
            pgb_tag = '#pgb_'+file_order[key]
            lbl_tag = '#lbl_'+file_order[key]

            $(pgb_tag,child.document).progressbar({
                value: 0,
                max:100,
                change: function(){
                        lbl_tag = pgb_tag.replace(/pgb/,'lbl')
                        var v = $(pgb_tag,child.document).progressbar("value");
                        var txt = $(lbl_tag,child.document).text()
                        var pattern = /^(\d+)\%/
                        current_v = txt.match(pattern)
                        
                        if(current_v != null){
                            if(v >= current_v[1]){
                                $(lbl_tag,child.document).text(v + "%");
                                //console.log(pgb_tag,lbl_tag,v)
                            }
                        }else{
                            $(lbl_tag,child.document).text(v + "%")
                        }
                    },
                    complete: function(){
                        lbl_tag = pgb_tag.replace(/pgb/,'lbl')
                        $(lbl_tag,child.document).text("Completed");
                        console.log(key,' Completed')
                    }
                })
          }, tag_txt)         
    }
    console.log(file_order)
}

let pgb_update = function(p,file_name){
    pgb_tag = '#pgb_'+file_order[file_name]
    $(pgb_tag,child.document).progressbar('value',parseInt(p,10))
    console.log('in pbg_update p=',parseInt(p,10),file_name)
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

let createbody = function(items){
    txt = '<tr><td><input type=\"checkbox\" value=\"'+items[1]+'\" name=\"r_chk\"></td><td>'
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
    return Math.round(size, 2)+ext;
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

let test_progress = function(){
    $.ajax({type:'get',url:'/api/v1/init/',
    success:function(j){
        console.log(j['uuid'])
    }
    })
}