var num_sent = {}
var ajax_flag = {}
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
  pgb_initialize(this.files)
  for(k=0;k<this.files.length;k++){
    var file_name = this.files[k].name
    var file_size = this.files[k].size
    var file = this.files[k]
    var chunk_size = 1024*1024
    var chunk_number = Math.ceil(file.size/chunk_size)
    var slice_index = 0
    selected_bucket = $('#bucket-select option:selected').text()
    num_sent[file_name] = 0    
    for(i=0;i<chunk_number;i++){
      file_part = file.slice(slice_index,slice_index+chunk_size)
      result = send_upload_request(file_name,file_size,file_part,chunk_size,chunk_number,slice_index,selected_bucket,i)
      slice_index += chunk_size
    }
  }
}

let send_upload_request = function(file_name,file_size,file_part,chunk_size,chunk_number,slice_index,selected_bucket,i){
  var reader = new FileReader
  var formData = new FormData
  var url_option
  var p_1 = 0
  var p_2 = 0
  reader.onload = function(){
    formData.set(file_name,file_part)
    url_option = selected_bucket+'/'+file_name+'?index='+String(i)+'&chunk_size='+chunk_size
    console.log(url_option)

    $.ajax({type:'post',url:'/api/v1/bucket/object/upload/'+url_option,data:formData,contentType:false,processData:false,
      success: function(){ 
        num_sent[file_name] += 1
        console.log('a',file_name,num_sent[file_name])
        p_1 = parseInt((num_sent[file_name]/chunk_number*100/2).toFixed(0))
        pgb_update(p_1+p_2,file_name)
        
        if(num_sent[file_name] == chunk_number){
          url_option = selected_bucket+'/'+file_name+'?num='+chunk_number+'&size='+file_size
           $.ajax({type:'post',url:'/api/v1/bucket/object/concat/'+url_option,
            success: function(){
              //alert(file_name+' Upload Completed')
              //delete num_sent
              //delete file_order
              $('#bucket-select').change()
            }
          })
          check_chunk_status(selected_bucket,file_name,chunk_number,file_size,p_1)
        }
      }
    })
  }
  reader.readAsArrayBuffer(file_part)
}

let download_files = function(){
  files = []
  i = 0
  selected_bucket = $('#bucket-select option:selected').text()
  $("input[name=r_chk]:checked").each(function(){
    f = $(this).val()
    files[i] = {'name':f}
    i++
    
  })
  pgb_initialize(files)

  $("input[name=r_chk]:checked").each(function(){
    f = $(this).val()
    url_option = selected_bucket+'/'+ f
    $.ajax({type:'put',url:'/api/v1/bucket/object/download/'+url_option})
    check_download_status(selected_bucket,f)
  })
}

let send_download_request = function(f){
  selected_bucket = $('#bucket-select option:selected').text()
  //check_download_status(selected_bucket,f)
  var url = '/api/v1/bucket/object/download/'+selected_bucket+'/'+f
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Pragma', 'no-cache');
  xhr.setRequestHeader('Cache-Control', 'no-cache');
  xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00')
  xhr.responseType = 'blob';
  
  xhr.onprogress = function (evt) {
    var load = (100*evt.loaded/evt.total|0)/2+50
    pgb_update(load,f)
  };
  
  xhr.onreadystatechange = function (e) {
    if (this.readyState == 4 && this.status == 200) {
      var blob = this.response;

      //IE, Edge とその他で処理の切り分け
      if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, f);
      } else {
        var a = document.createElement("a");
        // IE11 は URL API をサポートしてない
        var url = window.URL;
        a.href = url.createObjectURL(new Blob([blob],
                                    { type: blob.type }));
        document.body.appendChild(a);
        a.style = "display: none";
        a.download = f
        a.click();
        document.body.removeChild(a)
      }
    }
    
  }
  xhr.send()
}

let check_chunk_status= function(selected_bucket,file_name,chunk_number,file_size,p_1){
  console.log('check_chunk_status called')
  var p_2 = 0
  var p_3 = 0
  var timer = {}
  timer[file_name] = setInterval(function(){
    url_option = selected_bucket+'/'+file_name+'?num='+chunk_number+'&size='+file_size
    $.ajax({type:'get',url:'/api/v1/bucket/object/concat/'+url_option,
      success: function(j){
          pgb_update(p_1+p_2+p_3,file_name)
        if(j['completed'] == 'yes'){
          clearInterval(timer[file_name])
          pgb_update(100,file_name)
          console.log('upload cleared',file_name)
        }else{
          p_2 = parseInt((j['concat_size']/file_size*100/4).toFixed(0))
          p_3 = parseInt((j['s3_progress']/4).toFixed(0)) 
          console.log(file_name,p_1,p_2,p_3)
          //console.log('p_3=',p_3)
        }
      }
    })
  },500)
}

let check_download_status= function(selected_bucket,file_name){
  console.log('check_download_status called ',file_name)
  var timer = {}
  p = 0
  ajax_flag[file_name] = 'not sending'
  timer[file_name] = setInterval(function(){  
    url_option = selected_bucket+'/'+file_name
    console.log(ajax_flag[file_name],file_name)
    if(ajax_flag[file_name] == 'not sending'){
      ajax_flag [file_name] = 'sent'
      $.ajax({type:'get',url:'/api/v1/bucket/object/download/status/'+url_option,
        success: function(j){
          ajax_flag[file_name] = 'not sending'
          if(parseInt(j['progress']).toFixed(0) == 100){
            clearInterval(timer[file_name])
            pgb_update(50,file_name)
            console.log('download cleared',file_name)
            send_download_request(file_name)
          }else{            
            p = parseInt((j['progress']).toFixed(0))/2
            console.log(file_name,p)
            pgb_update(p,file_name)
            //console.log('p_3=',p_3)
          }
        }
      })
    }
  },500)
}

let delete_files = function(){
  if($("input[name=r_chk]:checked").length == 0){
    alert('Please select files')
  }
  selected_bucket = $('#bucket-select option:selected').text()
  $("input[name=r_chk]:checked").each(function(){
    f = $(this).val()
    $.ajax({type:'post', url:'/api/v1/bucket/object/delete/'+selected_bucket+'/'+f,
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

let refresh_object_list = function(){
  $('#bucket-select').change()
}