let pgb_initialize = function(){
    txt = '<p>AAAAAAAAAAAA</p><div id="pgb"></div><div id="lbl"></div></div>'
    progress_window()
    child.onload = function(){
        $('#progress_bar',child.document).append(txt)
        console.log(txt)
        tag = '#pgb'
        $(tag,child.document).progressbar({
            value: 0,
            max:100,
            change: function(){
            var v = $("#pgb",child.document).progressbar("value");
            $("#lbl",child.document).text(v + "%");
            },
            complete: function(){
            $("#lbl",child.document).text("完了しました");
            }
            })
            /*
            i=0
            timer = setInterval(function(){
                if(i <= 50){
                    $('#pgb',child.document).progressbar('value',i)
                    i+=10
                }else{
                    clearInterval(timer)
                }
            },500)*/
            
    }
    //return child
}

let pgb_update = function(p){
    $('#pgb',child.document).progressbar('value',parseInt(p,10))
    console.log(p)
}
let progress_window = function(){
    child = window.open('progress.html','_blank','width=500,height=500,scrollbars=1,location=0,menubar=0,toolbar=0,status=1,directories=0,resizable=1,left='+(window.screen.width-500)/2+',top='+(window.screen.height-500)/2)
}

let open_modal = function(){
    
    waitingDialog.show('please wait',{rtl:false})
    i=0
            timer = setInterval(function(){
                if(i <= 50){
                    waitingDialog.progress(i)
                    i+=10
                }else{
                    clearInterval(timer)
                }
            },500)

}

let close_modal = function(){
    var pleaseWait = $('#pleaseWaitDialog'); 
    
 
    
    hidePleaseWait = function () {
        pleaseWait.modal('hide');
    }
    hidePleaseWait()

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