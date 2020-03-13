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

  // 削除予定
  $('#bucket-select').val('furukubo')
}

let draw_object_list = function(data){
  $('#object_list').empty()
  var k = 1
  var txt = ''
  for (key in data){
    var items = [k,key,convertByteSize(data[key])]
    txt = createbody(items)
    $('#object_list').append(txt)
    k++
  }
  ind_select()
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
  var file_name = this.files[0].name
  var file_size = this.files[0].size
  var file = $('#upload_file').get(0).files[0]
  var formData = new FormData
  var chunk_size = 1024*1024
  var chunk_number = Math.ceil(file.size/chunk_size)
  var slice_index = 0
  var num_sent = 0
  var i=0
  var file_part = file.slice(slice_index,slice_index+chunk_size)
  slice_index += chunk_size
  var reader = new FileReader

  var selected_bucket
  var url_option
  var p_1 = 0
  var p_2 = 0
  var check_chunk_status_called = false
  pgb_initialize()
  reader.onload = function(){
    formData.set(file_name,file_part)
    selected_bucket = $('#bucket-select option:selected').text()
    url_option = selected_bucket+'/'+file_name+'?index='+String(i)+'&chunk_size='+chunk_size

    $.ajax({type:'post',url:'/api/v1/bucket/object/upload/'+url_option,data:formData,contentType:false,processData:false,
      success: function(){ 
        num_sent++
        p_1 = parseInt((num_sent/chunk_number*100/2).toFixed(0))
        pgb_update(p_1+p_2)
        if(num_sent == chunk_number){
          url_option = selected_bucket+'/'+file_name+'?num='+chunk_number+'&size='+file_size
          check_chunk_status(selected_bucket,file_name,chunk_number,file_size,p_1)
          $.ajax({type:'post',url:'/api/v1/bucket/object/concat/'+url_option,
            success: function(){
              //alert(file_name+' Upload Completed')
              $('#bucket-select').change()
            }
          })
        }
      }
    })

    if(slice_index < file.size){
      file_part = file.slice(slice_index,slice_index+chunk_size)
      slice_index += chunk_size
      reader.readAsArrayBuffer(file_part)
      i++
    }
  }
  reader.readAsArrayBuffer(file_part)
}

let check_chunk_status= function(selected_bucket,file_name,chunk_number,file_size,p_1){
  //console.log('setInterval called')
  p_2 = 0
  timer = setInterval(function(){
    url_option = selected_bucket+'/'+file_name+'?num='+chunk_number+'&size='+file_size
    $.ajax({type:'get',url:'/api/v1/bucket/object/concat/'+url_option,
      success: function(j){
        pgb_update(p_1+p_2)
        if(j['num'] == 0){
          clearInterval(timer)
          console.log('cleared')
        }else{
          p_2 = parseInt((j['concat_size']/file_size*100/2).toFixed(0))
          //console.log('p_2=',p_2)
        }
      }
    })
  },1000)
}

let delete_files = function(){
  if($("input[name=r_chk]:checked").length == 0){
    alert('Please select files')
  }
  selected_bucket = $('#bucket-select option:selected').text()
  $("input[name=r_chk]:checked").each(function(){
    f = $(this).val()
    $.ajax({type:'post', url:'/api/v1/bucket/object/delete/'+selected_bucket+'/'+f+'/',
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
  $.ajax({t3ype:'get', url:'/api/v1/bucket/object/' + val,
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
      var txt = reader.result
      var access_key_pattern = /Access\sKey:\s(\S+)\n/
      access_key = txt.match(access_key_pattern)
      $('#access_key').val(access_key[1])

      var secret_key_pattern = /Secret\sKey:\s(\S+)\n/
      secret_key = txt.match(secret_key_pattern)
      $('#secret_key').val(secret_key[1])
    }
  }
}