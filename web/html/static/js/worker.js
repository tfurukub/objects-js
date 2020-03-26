self.addEventListener('message',function(e){
    d = e.data
    file_name = d['file_name']
    files = d['files']
    uuid = d['uuid']
    chunk_size = d['chunk_size']
    i = d['index']
    selected_bucket = d['bucket']
    
    var url = '/api/v1/bucket/object/upload/' + selected_bucket+'/'+file_name+'?index='+String(i)+'&chunk_size='+chunk_size + '&uuid='+uuid
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00')
    xhr.responseType = 'blob';
    var formData = new FormData
    formData.set(file_name,files)

    xhr.onreadystatechange = function (e) {
        if (this.readyState == 4 && this.status == 200) {
            d['status'] = 'complete'
            self.postMessage(d)
        }
    }

    xhr.upload.onprogress = function (evt) {
        //var load = (100*evt.loaded/evt.total|0)/2+50
        d['p'] = evt.loaded
        self.postMessage(d)
    }
    xhr.send(formData)
},false)