import json
import os
import re
import shutil
from flask import Flask, jsonify, request, make_response
import objects_highlevel

ACCESS_KEY = ''
SECRET_KEY = ''
ENDPOINT_URL = ''
SAVE_DIR = '/src/tmp/'
SECRET_FILE = 'secret.json'

#PORT = int(os.environ['PORT'])
#DEBUG = os.environ['DEBUG'].lower() == 'true'



OBJECT_BOTO3 = objects_highlevel.Objects_boto3(ACCESS_KEY,SECRET_KEY,ENDPOINT_URL)
app = Flask('pdf creator')

#
# Configure KEY
#

@app.route('/api/v1/info/',methods=['PUT'])
def configure_info():
    body = request.get_data().decode().strip()
    
    if os.path.isfile(os.path.join('/src/',SECRET_FILE)):
        with open(os.path.join('/src/',SECRET_FILE),'r') as f:
            d = json.load(f)
    else:
        d = json.loads(body)
    print(d)
    OBJECT_BOTO3.update_info(d['access_key'],d['secret_key'],d['endpoint_url'])
    return jsonify({},200)

#
# Bucket
#

@app.route('/api/v1/bucket/',methods=['GET'])
def bucket_list():
    b_list = OBJECT_BOTO3.list_bucket()
    return jsonify(b_list)

@app.route('/api/v1/bucket/object/<bucket_name>/',methods=['GET'])
def object_list(bucket_name):
    o_list = OBJECT_BOTO3.list_object(bucket_name)
    return jsonify(o_list)

@app.route('/api/v1/bucket/<bucket_name>',methods=['PUT','DELETE'])
def buckets(bucket_name):
    if request.method == 'PUT':
        result = OBJECT_BOTO3.create_bucket(bucket_name)
        return jsonify(result)
    if request.method == 'DELETE':
        result = OBJECT_BOTO3.delete_bucket(bucket_name)
        return jsonify(result)

@app.route('/api/v1/bucket/object/upload/<bucket_name>/<file_name>',methods=['POST'])
def upload_file(bucket_name,file_name):
    if os.path.isdir(SAVE_DIR) == False:
        os.mkdir(SAVE_DIR)
    file = request.files[file_name]
    file_name = request.args.get('index')+'_'+file_name
    file.save(os.path.join(SAVE_DIR,file_name))
    
    #result = OBJECT_BOTO3.upload_file(bucket_name,file_name)
    result = ''
    return(jsonify(result))

@app.route('/api/v1/bucket/object/concat/<bucket_name>/<file_name>',methods=['GET','POST'])
def concat_file(bucket_name,file_name):
    files = os.listdir(SAVE_DIR)
    filepath = os.path.join(SAVE_DIR,file_name)
    
    if request.method == 'POST':
        num = 0   
        files_ordered = []
        for item in files:
            pattern = '^(\d+)_'+file_name
            match_result = re.match(pattern,item)
            if match_result:
                num = num+1
                files_ordered.insert(int(match_result.group(1)),item)
        
        if str(num) == request.args.get('num'):
            with open(filepath,'wb') as savefile:
                for i in range(num):
                    data = open(os.path.join(SAVE_DIR,files_ordered[i]),'rb').read()
                    savefile.write(data)
                    savefile.flush()
        result = OBJECT_BOTO3.upload_file(bucket_name,file_name)

        for item in files_ordered:
            os.remove(os.path.join(SAVE_DIR,item))
        return(jsonify(result))

    if request.method == 'GET':
        concat_size = 0
        p = objects_highlevel.percentage
        print('p=',p)
        if os.path.isfile(filepath):
            concat_size = os.path.getsize(filepath)
        return(jsonify({'num':len(files),'concat_size':concat_size,'s3_progress':p}),200)

@app.route('/api/v1/bucket/object/delete/<bucket_name>/<file_name>/',methods=['POST'])
def delete_file(bucket_name,file_name):
    result = OBJECT_BOTO3.delete_file(bucket_name,file_name)
    return jsonify(result)

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
    if os.path.isdir(SAVE_DIR):
        shutil.rmtree(SAVE_DIR)

    os.mkdir(SAVE_DIR)
    app.run(debug='true', host='0.0.0.0', port=80)
