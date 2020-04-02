num_sent = {}
let draw_bucket_list = function(){
  $.ajax({type:'get', url:'/api/v1/bucket/',
    success:function(j, status, xhr){      
      draw_bucket_list2(j)
    }, 
    error:function(j,status){
      alert(JSON.parse(unescape(j['responseText']))['Error']['Message'])
    }
  })
}

let draw_bucket_list2 = function(data){
  $.ajax({type:'get', url:'/api/v1/bucket/size/',
    success:function(j){
      
      $('#viewing_num').text('Viewing all '+data.length+'  Buckets')
      $('#bucket_list').empty()
      data.forEach(function(b_name){
        var txt_base = '<tr><td><input type=\"checkbox\" value=\"'+b_name+'\" name=\"r_chk\"></td><td>'
        tag = '<a href=\"javascript:bucket_clicked(\''+b_name+'\')\">'+b_name+'</a>'
        var items = [tag,convertByteSize(j['size'][b_name]),j['num'][b_name]]
        txt = createbody(txt_base,items)
        $('#bucket_list').append(txt)
      })
      $('#object_list_wrapper').hide()
      $('#bucket_list_wrapper').show()
    }
  })
}

let draw_object_list = function(data){
  
  $('#object_list').empty()
  var k = 1
  var txt = ''
  
  for (key in data){
    var items = [k,key,convertByteSize(data[key])]
    var txt_base = '<tr><td><input type=\"checkbox\" value=\"'+key+'\" name=\"r_chk\"></td><td>'
    txt = createbody(txt_base,items)
    $('#object_list').append(txt)
    k++
  }
  ind_select()
  $('#bucket_list_wrapper').hide()
  $('#object_list_wrapper').show()
}

let create_bucket = function(){
  var bucket_name = $('#buckets').val()
  $.ajax({type:'put', url:'/api/v1/bucket/'+bucket_name,
    success:function(j, status, xhr){
      draw_bucket_list()
      alert(bucket_name+' is successfully created')
    }, 
    error:function(j){
      alert(JSON.parse(unescape(j['responseText']))['Error']['Message'])
    }
  })
}

let delete_bucket = function(){
  var bucket_name = $('#buckets').val()
  $.ajax({type:'delete', url:'/api/v1/bucket/'+bucket_name,
    success:function(j, status, xhr){
      draw_bucket_list()
      alert(bucket_name+' is successfully deleted')
    }, 
    error:function(j){
      alert(JSON.parse(unescape(j['responseText']))['Error']['Message'])
    }
  })
}

let upload_files = function(){
  files = this.files
  pgb_initialize(files)
  open_modal(files.length)
  var d = {}
  sent_bytes = {}
  for(k=0;k<files.length;k++){
    var file_name = files[k].name
    var file_size = files[k].size
    var file = files[k]
    var chunk_size = 1024*1024*1000
    var chunk_number = Math.ceil(file.size/chunk_size)
    var slice_index = 0
    var uuid = generateUuid()
    var selected_bucket = $('#object_list_wrapper').val()
    d1 = {}
    d1['file_name'] = file_name
    d1['file_size'] = file_size
    d1['chunk_size'] = chunk_size
    d1['chunk_number'] = chunk_number
    d1['slice_index'] = slice_index
    d1['num'] = k
    d1['bucket'] = selected_bucket
    d1['uuid'] = uuid
    d1['sent_bytes'] = {}
    d[uuid] = d1

    num_sent[file_name] = 0
    url_option = file_name + '/' + uuid + '/upload/'
    sent_bytes[file_name] = {}

    $.ajax({type:'put',url:'/api/v1/init/'+url_option,
      success:function(j){
        uuid_l = j['uuid']
        d2 = d[j['uuid']]

        for(i=0;i<d2['chunk_number'];i++){
          file_part = files[d2['num']].slice(d2['slice_index'],d2['slice_index']+d2['chunk_size'])
          d2['files'] = file_part
          d2['index'] = i
          d2['sent_bytes'][i] = 0

          worker = new Worker('/static/js/worker.js')
          worker.addEventListener('message', function(e) {
            if(e.data['status'] == 'complete'){
              num_sent[e.data['file_name']] += 1
              p_1 = parseInt((num_sent[e.data['file_name']]/e.data['chunk_number']*100/2).toFixed(0))              
              if(num_sent[e.data['file_name']] == e.data['chunk_number']){
                url_option = e.data['bucket']+'/'+e.data['file_name']+'?num='+e.data['chunk_number']+'&uuid='+e.data['uuid']
                $.ajax({type:'post',url:'/api/v1/bucket/object/concat/'+url_option,
                  success: function(){
                    bucket_clicked(e.data['bucket'])
                  }
                })
                check_chunk_status(e.data['bucket'],e.data['file_name'],e.data['chunk_number'],e.data['file_size'],p_1,e.data['uuid'])
              }
            }else{
              d2['sent_bytes'][e.data['index']] = e.data['p']
              obj = d2['sent_bytes']
              p = 0
              Object.keys(obj).forEach(function(key){
                p += obj[key]                
              })
              p_1 = parseInt(p/e.data['file_size']*100/2).toFixed(0)
              if(p_1 > 50){
                p_1 = 50
              }
              pgb_update(p_1,e.data['file_name'])
              //console.log(e.data['file_name'],d2['sent_bytes'])
            }
            
          }, false)
          worker.postMessage(d2)
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

let download_files = function(){
  files = []
  i = 0
  selected_bucket = $('#object_list_wrapper').val()
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
  selected_bucket = $('#object_list_wrapper').val()
  checked = $("input[name=r_chk]:checked")
  checked.each(function(){
    f = $(this).val()
    files[i] = {'name':f}
    i++
    
  })
  pgb_initialize(files)
  open_modal(checked.length)
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
  selected_bucket = $('#object_list_wrapper').val()
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
      //console.log('in xhr.onprogress',load,f)
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
        //console.log(p_1,p_2,p_3,file_name)
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
  selected_bucket = $('#object_list_wrapper').val()
  $("input[name=r_chk]:checked").each(function(){
    f = $(this).val()
    $.ajax({type:'post', url:'/api/v1/bucket/object/delete/'+selected_bucket+'/'+f,
      success:function(j, status, xhr){
        bucket_clicked(selected_bucket)
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

let bucket_clicked = function(bucket_name){
  $.ajax({type:'get', url:'/api/v1/bucket/object/' + bucket_name,
    success:function(j, status, xhr){
      $('#object_list_header').text('Object List (Bucket Name = '+bucket_name+' )')
      $('#object_list_wrapper').val(bucket_name)
      draw_object_list(j)
    }, 
    error:function(d){

    }
  })
}

let get_server_info = function(){
  $.ajax({type:'put', url:'/api/v1/connect/',
    success: function(j){
      $('#connect_objects').text('Connect to '+j['endpoint_url'])
    },
    error: function(j){
      alert(j['responseJSON']['error'])
    }
  })
}
let connect_objects = function(){
  var button = $(this);
  button.attr("disabled", true)
  dispLoading($('#connect_objects').text().replace('Connect','Connecting'))

  $.ajax({type:'put', url:'/api/v1/connect/',
      success: function(json_data) {
        $.ajax({type:'get', url:'/api/v1/bucket/',
          success:function(j, status, xhr){      
            draw_bucket_list2(j)
            removeLoading()
            button.attr("disabled", false)
            $('#connect_objects').hide()
          }, 
          error:function(j,status){
            alert(JSON.parse(unescape(j['responseText']))['Error']['Message'])
            removeLoading()
            button.attr("disabled", false)
          }
        })
      },
      error: function() {
          alert("Server Error. Pleasy try again later.");
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