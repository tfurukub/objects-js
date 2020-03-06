let draw_bucket_list = function(){
     $.ajax({type:'get', url:'/api/v1/bucket/',
    success:function(j, status, xhr){
      draw_bucket_list2(j)
    }, 
    error:function(j){
      console.log(j)
    }
  })
}

let draw_bucket_list2 = function(data){
  $('#bucket-select').empty()
  $("#bucket-select").append($("<option>").val('').text(''))
  data.forEach(function(b_name){
    $("#bucket-select").append($("<option>").val(b_name).text(b_name))
  })
  $('#number_of_buckets').empty()
  $('#number_of_buckets').append('# of Buckets = '+data.length)
}

let draw_object_list = function(data){
  $('#object_list').empty()
  k = 1
  for (key in data){
    items = [k,key,convertByteSize(data[key])]
    txt = createbody(items)
    $('#object_list').append(txt)
    k++
  }
}

let create_bucket = function(){
  var bucket_name = $('#buckets').val()
  $.ajax({type:'put', url:'/api/v1/bucket/'+bucket_name,
    success:function(j, status, xhr){
      draw_bucket_list()
    }, 
    error:function(j){
      console.log(j)
    }
  })
}

let delete_bucket = function(){
  var bucket_name = $('#buckets').val()
  $.ajax({type:'delete', url:'/api/v1/bucket/'+bucket_name,
    success:function(j, status, xhr){
      bucket_changed()
    }, 
    error:function(j){
      console.log(j)
    }
  })
}

let upload_files = function(){
  file_name = this.files[0].name
  var file = $('#upload_file').get(0).files[0]
  var formData = new FormData
  formData.append(file_name,file)
  
  $.ajax({type:'post',url:'/api/v1/bucket/object/upload/furukubo/'+file_name+'/',data:formData,contentType:false,processData:false,
    success: function(){
      $('#bucket-select').change()
      alert('uploaded')
    }
  })
}

let delete_files = function(){
  if($("input[name=r_chk]:checked").length == 0){
    alert('Please select files')
  }
  $("input[name=r_chk]:checked").each(function(){
    f = $(this).val()
    $.ajax({type:'post', url:'/api/v1/bucket/object/delete/furukubo/'+f+'/',
    success:function(j, status, xhr){
      $('#bucket-select').change()
    }, 
    error:function(j){
      console.log(j)
    }
  })
  })

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
       endpoint_url: 'http://'+$('#endpoint_url').val(),
       access_key: $("#access_key").val(),
       secret_key: $("#secret_key").val()
   }
   update_key2(data,button)
  }

  let update_key2 = function(data,button){

   // 通信実行
   $.ajax({
       type:"put",                // method = "POST"
       url:"/api/v1/info/",        // POST送信先のURL
       data:JSON.stringify(data),  // JSONデータ本体
       contentType: 'application/json', // リクエストの Content-Type
       dataType: "json",           // レスポンスをJSONとしてパースする
       success: function(json_data) {   // 200 OK時
           draw_bucket_list()
       },
       error: function() {         // HTTPエラー時
           alert("Server Error. Pleasy try again later.");
       },
       complete: function() {      // 成功・失敗に関わらず通信が終了した際の処理
           button.attr("disabled", false);  // ボタンを再び enableにする
       }
   });
}

let parse_info_file = function(){
  if (this.files[0].type == 'text/plain'){
    var reader = new FileReader()
    reader.readAsText(this.files[0], 'UTF-8')
    reader.onload = function(){
      txt = reader.result
      var access_key_pattern = /Access\sKey:\s(\S+)\n/
      access_key = txt.match(access_key_pattern)
      $('#access_key').val(access_key[1])

      var secret_key_pattern = /Secret\sKey:\s(\S+)\n/
      secret_key = txt.match(secret_key_pattern)
      $('#secret_key').val(secret_key[1])
    }
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