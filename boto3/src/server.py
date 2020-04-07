import json
import os
import re
import shutil
import time
import uuid
import random
from flask import Flask, jsonify, request, make_response,send_from_directory
import objects_highlevel

ACCESS_KEY = ''
SECRET_KEY = ''
ENDPOINT_URL = 'http://0.0.0.0'
UPLOAD_SAVE_DIR = '/src/upload/'
DOWNLOAD_SAVE_DIR = '/src/download/'
SECRET_FILE = 'secret.json'

#PORT = int(os.environ['PORT'])
#DEBUG = os.environ['DEBUG'].lower() == 'true'



OBJECT_BOTO3 = objects_highlevel.Objects_boto3(ACCESS_KEY,SECRET_KEY,ENDPOINT_URL)
app = Flask('pdf creator')

#
# Configure KEY
#

@app.route('/api/v1/connect/',methods=['PUT'])
def connect_to_objects():
    #body = request.get_data().decode().strip()
    
    if os.path.isfile(os.path.join('/src/',SECRET_FILE)):
        with open(os.path.join('/src/',SECRET_FILE),'r') as f:
            d = json.load(f)
            OBJECT_BOTO3.update_info(d['access_key'],d['secret_key'],d['endpoint_url'])
            return jsonify(d),200
    else:
        return jsonify({'error':'AWS key file (secret.json) does not exist'}),500
    

#
# Bucket
#

@app.route('/api/v1/bucket/',methods=['GET'])
def bucket_list():
    status,b_list = OBJECT_BOTO3.list_bucket()
    if status == True:
        return jsonify(b_list),200
    else:
        response = make_response(json.dumps(status),500)
        return response
    
@app.route('/api/v1/bucket/info/',methods=['GET'])
def bucket_info():
    #status,size_list,num_list = OBJECT_BOTO3.bucket_info()
    status,data = OBJECT_BOTO3.bucket_info()
    if status == True:
        #d = {'size':size_list,'num':num_list}
        d = {"data":data}
        print(d)
        return jsonify(d),200
    else:
        response = make_response(json.dumps(status),500)
        return response

@app.route('/api/v1/bucket/object/<bucket_name>/',methods=['GET'])
def object_list(bucket_name):
    status,o_list = OBJECT_BOTO3.list_object(bucket_name)
    if status == True:
        d = {"data":o_list}
        #return jsonify(o_list),200
        return jsonify(d),200
    else:
        response = make_response(json.dumps(status),500)
        return response

@app.route('/api/v1/bucket/<bucket_name>',methods=['PUT','DELETE'])
def buckets(bucket_name):
    if request.method == 'PUT':
        status,result = OBJECT_BOTO3.create_bucket(bucket_name)
        if status == True:
            return jsonify({}),200
        else:
            response = make_response(json.dumps(status),500)
            return response

    if request.method == 'DELETE':
        status,b_list = OBJECT_BOTO3.list_bucket()
        if status == True:
            if bucket_name in b_list:
                status,result = OBJECT_BOTO3.delete_bucket(bucket_name)
                if status == True:
                    return jsonify(result),200
                else:
                    response = make_response(json.dumps(status),500)
                    return response
            else:
                e = 'bucket name = '+bucket_name + ' does not exist'
                result = {'Error':{'Message':str(e)}}
                response = make_response(json.dumps(result),500)
                return response
        else:
            response = make_response(json.dumps(status),500)
            return response


@app.route('/api/v1/init/<file_name>/<uuid>/<op>/',methods=['PUT'])
def init_percentage(uuid,file_name,op):
    OBJECT_BOTO3.init_percentage(uuid,file_name)

    if uuid in OBJECT_BOTO3.per:
        if op == 'download':
            save_dir_path = os.path.join(DOWNLOAD_SAVE_DIR,uuid)
        elif op == 'upload':
            save_dir_path = os.path.join(UPLOAD_SAVE_DIR,uuid)
        else:
            return (jsonify({'error':'failed to initialize'}),500)

        if not os.path.isdir(save_dir_path):
            os.mkdir(save_dir_path)
        return (jsonify({'uuid':uuid,'file_name':file_name}),200)
    else:
        return (jsonify({'error':'failed to initialize'}),500)

@app.route('/api/v1/bucket/object/upload/<bucket_name>/<file_name>',methods=['POST','DELETE'])
def upload_file(bucket_name,file_name):
    uuid = request.args.get('uuid')  
    save_dir_path = os.path.join(UPLOAD_SAVE_DIR,uuid)
    if request.method == 'POST':
        if os.path.isdir(save_dir_path) == False:
            return jsonify({}),500
        file = request.files[file_name]
        file_name = request.args.get('index')+'_'+file_name
        file.save(os.path.join(save_dir_path,file_name))
        return jsonify({'uuid':uuid}),200
    if request.method == 'DELETE':
        shutil.rmtree(save_dir_path)
        OBJECT_BOTO3.delete_percentage(uuid)
        return jsonify({}),200


@app.route('/api/v1/bucket/object/concat/<bucket_name>/<file_name>',methods=['GET','POST'])
def concat_file(bucket_name,file_name):
    uuid = request.args.get('uuid')
    save_dir_path = os.path.join(UPLOAD_SAVE_DIR,uuid)
    files = os.listdir(save_dir_path)
    filepath = os.path.join(save_dir_path,file_name)
    
    if request.method == 'POST':
        chunk_number = int(request.args.get('num'))
        files_ordered = []
        for i in range(chunk_number):
            sliced_filename = str(i)+'_'+file_name
            if sliced_filename in files:
                files_ordered.append(sliced_filename)
            else:
                for item in files_ordered:
                    os.remove(os.path.join(save_dir_path,item))
                return jsonify({'error':'Files not sent correctly'})
        
        with open(filepath,'wb') as savefile:
            for i in range(chunk_number):
                data = open(os.path.join(save_dir_path,files_ordered[i]),'rb').read()
                savefile.write(data)
                savefile.flush()
        result = OBJECT_BOTO3.upload_file(bucket_name,file_name,filepath,uuid)
        return jsonify({}),200

    if request.method == 'GET':
        concat_size = 0
        p = OBJECT_BOTO3.per[uuid]['p']
        if os.path.isfile(filepath):
            concat_size = os.path.getsize(filepath)

        if p == 100:
            return(jsonify({'concat_size':concat_size,'s3_progress':p,'uuid':uuid}),200)
        return jsonify({'concat_size':concat_size,'s3_progress':p,'uuid':uuid}),200

@app.route('/api/v1/bucket/object/download/<bucket_name>/<file_name>',methods=['PUT','GET','DELETE'])
def download_file(bucket_name,file_name):
    uuid = request.args.get('uuid')
    save_dir_path = os.path.join(DOWNLOAD_SAVE_DIR,uuid)
    filepath = os.path.join(save_dir_path,file_name)
    if not os.path.isdir(save_dir_path):
        os.mkdir(save_dir_path)
    
    if request.method == 'PUT':
        status = OBJECT_BOTO3.download_file(bucket_name,file_name,filepath,uuid)
        if status == True:
            return jsonify({}),200
        else:
            response = make_response(json.dumps(status),500)
            return response
    if request.method == 'GET':
        i = 0
        while i<=10:
            if os.path.isfile(filepath) == False:
                print('wait for 1 second')
                time.sleep(1)
                i+=1
            else:
                break
            
        if os.path.isfile(filepath):
            f = send_from_directory(save_dir_path, file_name,as_attachment = True, attachment_filename = file_name)
            return f
        else:
            return (jsonify({}),404)
    if request.method == 'DELETE':
        shutil.rmtree(save_dir_path)
        OBJECT_BOTO3.delete_percentage(uuid)
        return(jsonify({}),200)

@app.route('/api/v1/bucket/object/download/status/<bucket_name>/<file_name>',methods=['GET'])
def download_status(bucket_name,file_name):
    uuid = request.args.get('uuid')
    save_dir_path = os.path.join(DOWNLOAD_SAVE_DIR,uuid)
    if not os.path.isdir(save_dir_path):
        os.mkdir(save_dir_path)
    p = OBJECT_BOTO3.per[uuid]['p']
    return (jsonify({'progress':p}),200)
 
@app.route('/api/v1/bucket/object/delete/<bucket_name>/<file_name>',methods=['POST'])
def delete_file(bucket_name,file_name):
    result = OBJECT_BOTO3.delete_file(bucket_name,file_name)
    return jsonify(result)

@app.route('/api/v1/dummy/',methods=['GET'])
def dummy():
    d = []
    
    data = {"data":d}
    return jsonify(data),200

@app.route('/api/v1/test/',methods=['GET'])
def test():
    data = []
    num = random.randint(1,20)
    for i in range(int(num)):
        data.append([i,2*i,3*i,10*i])
    print({"data":data})
    return jsonify({"data":data})

#
# util
#


@app.errorhandler(404)
def api_not_found_error(error):
    """General 404 error."""
    return (jsonify({'error': "api not found", 'code': 404}), 404)


@app.errorhandler(405)
def method_not_allowed_error(error):
    """General 405 error."""
    return (jsonify({'error': 'method not allowed', 'code': 405}), 405)


@app.errorhandler(500)
def internal_server_error(error):
    """General 500 error."""
    return (jsonify({'error': 'server internal error', 'code': 500}), 500)


if __name__ == '__main__':
    #app.run(debug=DEBUG, host='0.0.0.0', port=PORT)
    if os.path.isdir(UPLOAD_SAVE_DIR):
        shutil.rmtree(UPLOAD_SAVE_DIR)
    if os.path.isdir(DOWNLOAD_SAVE_DIR):
        shutil.rmtree(DOWNLOAD_SAVE_DIR)

    os.mkdir(UPLOAD_SAVE_DIR)
    os.mkdir(DOWNLOAD_SAVE_DIR)
    app.run(debug='true', host='0.0.0.0', port=80)
