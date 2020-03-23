var num_sent = {}
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
  files = this.files
  pgb_initialize(files)
  var d = {}
  for(k=0;k<files.length;k++){
    var file_name = files[k].name
    var file_size = files[k].size
    var file = files[k]
    var chunk_size = 1024*1024*100
    var chunk_number = Math.ceil(file.size/chunk_size)
    var slice_index = 0
    var uuid = generateUuid()
    var selected_bucket = $('#bucket-select option:selected').text()
    d1 = {}
    d1['file_name'] = file_name
    d1['file_size'] = file_size
    d1['chunk_size'] = chunk_size
    d1['chunk_number'] = chunk_number
    d1['slice_index'] = slice_index
    d1['num'] = k
    d[uuid] = d1
    
    num_sent[file_name] = 0
    url_option = file_name + '/' + uuid + '/upload/'
    $.ajax({type:'put',url:'/api/v1/init/'+url_option,
      success:function(j){
        d2 = d[j['uuid']]
        num = d2['num']
        
        for(i=0;i<d2['chunk_number'];i++){
          file_part = files[num].slice(d2['slice_index'],d2['slice_index']+d2['chunk_size'])
          result = send_upload_request(d2['file_name'],d2['file_size'],file_part,d2['chunk_size'],d2['chunk_number'],d2['slice_index'],selected_bucket,i,j['uuid'])
          d2['slice_index'] += d2['chunk_size']
          
        }
      },
      error:function(j){
        console.log(j)
        alert('Failed to Initialize')
      }
    })
  }
}

let send_upload_request = function(file_name,file_size,file_part,chunk_size,chunk_number,slice_index,selected_bucket,i,uuid){
  var reader = new FileReader
  var formData = new FormData
  var url_option
  var p_1 = 0
  var p_2 = 0
 
  reader.onload = function(){
    formData.set(file_name,file_part)
    url_option = selected_bucket+'/'+file_name+'?index='+String(i)+'&chunk_size='+chunk_size + '&uuid='+uuid

    $.ajax({type:'post',url:'/api/v1/bucket/object/upload/'+url_option,data:formData,contentType:false,processData:false,
      success: function(j){ 
        
        num_sent[file_name] += 1
        p_1 = parseInt((num_sent[file_name]/chunk_number*100/2).toFixed(0))
        pgb_update(p_1,file_name)
        
        if(num_sent[file_name] == chunk_number){
          
          url_option = selected_bucket+'/'+file_name+'?num='+chunk_number+'&uuid='+j['uuid']
          $.ajax({type:'post',url:'/api/v1/bucket/object/concat/'+url_option,
            success: function(){
              $('#bucket-select').change()
            }
          })
          check_chunk_status(selected_bucket,file_name,chunk_number,file_size,p_1,j['uuid'])
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
  checked = $("input[name=r_chk]:checked")
  if(checked.length == 0){
    alert('Please select files')
  }else{
    download_files_continue()
  }
}

let download_files_continue = function(){
  files = []
  i = 0
  selected_bucket = $('#bucket-select option:selected').text()
  checked = $("input[name=r_chk]:checked")
  checked.each(function(){
    f = $(this).val()
    files[i] = {'name':f}
    i++
    
  })
  pgb_initialize(files)

  uuid_list = {}
  checked.each(function(){
    f = $(this).val()
    uuid = generateUuid()
    uuid_list[f] = uuid
    url_option = f + '/' + uuid + '/download/'
    $.ajax({type:'put',url:'/api/v1/init/'+url_option,
      success:function(j){
        url_option = selected_bucket+'/'+ j['file_name'] + '?uuid='+j['uuid']
        $.ajax({type:'put',url:'/api/v1/bucket/object/download/'+url_option})
        check_download_status(selected_bucket,j['file_name'],j['uuid'])
        
      },
      error:function(j){
        console.log(j)
        alert('Failed to Initialize')
      }
    })
  })
}

let send_download_request = function(f,uuid){
  selected_bucket = $('#bucket-select option:selected').text()
  //check_download_status(selected_bucket,f)
  var url = '/api/v1/bucket/object/download/'+selected_bucket+'/'+f + '?uuid='+uuid
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Pragma', 'no-cache');
  xhr.setRequestHeader('Cache-Control', 'no-cache');
  xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00')
  xhr.responseType = 'blob';
  
  xhr.onprogress = function (evt) {
    if(this.status == 200){
      var load = (100*evt.loaded/evt.total|0)/2+50
      pgb_update(load,f)
      if(parseInt(load).toFixed(0) == 100){
        url_option = selected_bucket+'/'+ f + '?uuid='+uuid
        $.ajax({type:'delete',url:'/api/v1/bucket/object/download/'+url_option})
      }
    }else{
      alert('Download Failed. File Name = '+f)
    }
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

let check_chunk_status= function(selected_bucket,file_name,chunk_number,file_size,p_1,uuid){
  url_option = selected_bucket+'/'+file_name+'?uuid='+uuid
    $.ajax({type:'get',url:'/api/v1/bucket/object/concat/'+url_option,
      success: function(j){
        
        p_2 = parseInt((j['concat_size']/file_size*100/4).toFixed(0))
        p_3 = parseInt((j['s3_progress']/4).toFixed(0))
        
        pgb_update(p_1+p_2+p_3,file_name)
        if(j['s3_progress'] == String(100)){
        
          pgb_update(100,file_name)
          url_option = selected_bucket+'/'+ file_name + '?uuid='+j['uuid']
          $.ajax({type:'delete',url:'/api/v1/bucket/object/upload/'+url_option})
        }else{
          
          check_chunk_status(selected_bucket,file_name,chunk_number,file_size,p_1,uuid)
        }
      }
    })
}

let check_download_status= function(selected_bucket,file_name,uuid){
  var timer = {}
  p = 0
  url_option = selected_bucket+'/'+file_name + '?uuid='+uuid
  $.ajax({type:'get',url:'/api/v1/bucket/object/download/status/'+url_option,
    success: function(j){
      if(j['progress'] == String(100)){
        pgb_update(50,file_name)
        send_download_request(file_name,uuid)
      }else{
        p = parseInt((j['progress']).toFixed(0))/2
        pgb_update(p,file_name)
        check_download_status(selected_bucket,file_name,uuid)
      }
    }
  })
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