let draw_bucket_list = function(){
   $.ajax({type:'get', url:'/api/v1/bucket/',
    success:function(j, status, xhr){
      draw_bucket_list2(j)
    }, 
    error:function(d){
      console.log("ERROR")
    }
  })
}

let draw_bucket_list2 = function(data){
  $('#buckert-select').empty()
  $("#bucket-select").append($("<option>").val('').text(''))
  data.forEach(function(b_name){
    $("#bucket-select").append($("<option>").val(b_name).text(b_name))
  })
}

let draw_object_list = function(data){
  $('#list').empty()
  k = 1
  for (key in data){
    items = [k,key,convertByteSize(data[key])]
    txt = createbody(items)
    $('#list').append(txt)
    k++
  }
}

let bucket_changed = function(){
  var val = $(this).val()
  $.ajax({type:'get', url:'/api/v1/bucket/object/' + val,
    success:function(j, status, xhr){
      draw_object_list(j)
    }, 
    error:function(d){

    }
  })
}

let update_key = function(){
   // 多重送信を防ぐため通信完了までボタンをdisableにする
   var button = $(this);
   button.attr("disabled", true);

   // 各フィールドから値を取得してJSONデータを作成
   var data = {
       endpoint_url: $('#endpoint_url').val(),
       access_key: $("#access_key").val(),
       secret_key: $("#secret_key").val()
   };
   console.log(data)

   // 通信実行
   
   $.ajax({
       type:"put",                // method = "POST"
       url:"/api/v1/info/",        // POST送信先のURL
       data:JSON.stringify(data),  // JSONデータ本体
       contentType: 'application/json', // リクエストの Content-Type
       dataType: "json",           // レスポンスをJSONとしてパースする
       success: function(json_data) {   // 200 OK時
           location.reload();
       },
       error: function() {         // HTTPエラー時
           alert("Server Error. Pleasy try again later.");
       },
       complete: function() {      // 成功・失敗に関わらず通信が終了した際の処理
           button.attr("disabled", false);  // ボタンを再び enableにする
       }
   });
}

let createbody = function(items){
  txt = '<tr><td>'
  num = 0
  items.forEach(function(item){
      if(num == 1 && isNaN(item) == false){
          txt = txt.slice(0,-4) + '<td id="' + item + '">'
      }
      txt += item + '</td><td>'
      num++
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