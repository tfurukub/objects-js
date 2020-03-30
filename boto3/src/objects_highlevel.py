##############################################################################
#
#  Script: Sample Program for Objects
#  Author: Takeo Furukubo
#  Description: Simple CRUD operation (High Level API)
#  Language: Python3
#
##############################################################################

import boto3
import threading
import os
import botocore
from botocore.exceptions import ClientError
from boto3.s3.transfer import S3Transfer
import datetime
from boto3.session import Session
import sys
from urllib3.exceptions import NewConnectionError

class ProgressPercentage(object):
    
    def __init__(self, file_size,file_name,uuid,per):
        self._size = float(file_size)
        self._seen_so_far = 0
        self._lock = threading.Lock()
        self._file_name = file_name
        self._uuid = uuid
        self._per = per

    def __call__(self, bytes_amount):
        # To simplify we'll assume this is hooked up
        # to a single filename.
        with self._lock:
            self._seen_so_far += bytes_amount
            self._per[self._uuid]['p'] = (self._seen_so_far / self._size) * 100
            print('percentage2 = ',self._per[self._uuid]['p'],self._file_name)

class Objects_boto3():
    def __init__(self,accesskey,secretkey,endpoint):
        self.accesskey = accesskey
        self.secretkey = secretkey
        self.endpoint = endpoint
        self.per = {}
        self.session = Session(aws_access_key_id=self.accesskey,aws_secret_access_key=self.secretkey)
        self.s3resource = self.session.resource('s3',endpoint_url=self.endpoint)
        self.client = self.session.client('s3',endpoint_url=self.endpoint)
    '''
    def boto3_session(self):
        #boto3.set_stream_logger()
        #botocore.session.Session().set_debug_logger()
        try:
            session = Session(aws_access_key_id=self.accesskey,aws_secret_access_key=self.secretkey)
            s3resource = session.resource('s3',endpoint_url=self.endpoint)
        except ClientError as e:
            print('###############Exception#################',e)
            return e
        else:            
            return s3resource
    '''
    def init_percentage(self,uuid,file_name):
        self.per[uuid] = {'file_name':file_name,'p':0}

    def delete_percentage(self,uuid):
        del self.per[uuid]

    def list_bucket(self):
        #s3resource = self.boto3_session()
        bucket_list = []
        try:
            for bucket in self.s3resource.buckets.all():            
                bucket_list.append(bucket.name)
        except NewConnectionError as e:
            print('Unexpected Error: %s' % e)
            status = {'Error':{'Message':str(e)}}
            return status,''
        except botocore.exceptions.EndpointConnectionError as e:
            print('Unexpected Error: %s' % e)
            status = {'Error':{'Message':str(e)}}
            return status,''
        except botocore.exceptions.ClientError as e:
            print('Unexpected Error: %s' % e.response)
            status = e.response
            return status,''
        except Exception as e:
            print('other error',e)
            status = {'Error':{'Message':str(e)}}
            return status,''
        else:
            status = True
            return status,bucket_list

    def create_bucket(self,bucket_name):
        try:
            result = self.s3resource.Bucket(bucket_name).create()
        except botocore.exceptions.ClientError as e:
            print('Unexpected Error: %s' % e.response)
            status = e.response
            return status,''
        else:
            status = True
            return status,result

    def delete_bucket(self,bucket_name):
        try:
            result = self.s3resource.Bucket(bucket_name).delete()
        except botocore.exceptions.ClientError as e:
            print('Unexpected Error: %s' % e.response)
            status = e.response
            return status,''
        else:
            status = True
            return status,result


    def list_object(self,bucket_name):
        #s3resource = self.boto3_session()
        object_list = {}
        try:
            bucket = self.s3resource.Bucket(bucket_name)
            for obj in bucket.objects.all():
                object_list[obj.key] = obj.size
        except Exception as e:
            print('other error',e)
            status = {'Error':{'Message':str(e)}}
            return status,''
        else:
            status = True
            return status,object_list

    def upload_file(self,bucket_name,file_name,filepath,uuid):
        #s3resource = self.boto3_session()
        local_file = filepath
        file_size = os.path.getsize(local_file)
        if os.path.exists(local_file):
            print('started sending file to Objects')
            self.s3resource.Bucket(bucket_name).upload_file(local_file,file_name,Callback=ProgressPercentage(file_size,file_name,uuid,self.per))
            return True
        else:
            return('No File Exist. Can not upload')

    def download_file(self,bucket_name,file_name,filepath,uuid):
        #s3resource = self.boto3_session()
        local_file = filepath
        remote_file = file_name
        
        file_size = self.s3resource.Object(bucket_name,remote_file).content_length
        result = self.s3resource.Bucket(bucket_name).download_file(remote_file,local_file,Callback=ProgressPercentage(file_size,remote_file,uuid,self.per))
        return result

    def delete_file(self,bucket_name,file_name):
        result = self.s3resource.Object(bucket_name,file_name).delete()
        return result

    def update_info(self,accesskey,secretkey,endpoint):
        self.accesskey = accesskey
        self.secretkey = secretkey
        self.endpoint = endpoint
        self.session = Session(aws_access_key_id=self.accesskey,aws_secret_access_key=self.secretkey)
        self.s3resource = self.session.resource('s3',endpoint_url=self.endpoint)