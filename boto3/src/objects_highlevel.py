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

    def bucket_info(self):
        status,bucket_list = self.list_bucket()
        size_list = {}
        num_list = {}
        d = []
        try:
            for bucket_name in bucket_list:
                bucket = self.s3resource.Bucket(bucket_name)
                size = 0
                num = 0
                for obj in bucket.objects.all():
                    size += obj.size
                    num += 1
                #size_list[bucket_name] = size
                #num_list[bucket_name] = num
                f_size,power_label = self.format_bytes(size)
                d.append([bucket_name,bucket_name,str(f_size)+' '+power_label,num])
        except Exception as e:
            print('other error',e)
            status = {'Error':{'Message':str(e)}}
            return status,'',''
        else:
            status = True
            #return status,size_list,num_list
            return status,d

    def list_object(self,bucket_name):
        #s3resource = self.boto3_session()
        #object_list = {}
        object_list = []
        try:
            bucket = self.s3resource.Bucket(bucket_name)
            for obj in bucket.objects.all():
                #object_list[obj.key] = obj.size
                size,power_label = self.format_bytes(obj.size)
                object_list.append([obj.key,obj.key,str(size)+' '+power_label])
        except Exception as e:
            print('other error',e)
            status = {'Error':{'Message':str(e)}}
            return status,''
        else:
            status = True
            return status,object_list

    def get_object_info(self):
        d = {}
        try:
            status, bucket_list = self.list_bucket()
            for bucket_name in bucket_list:
                bucket = self.s3resource.Bucket(bucket_name)
                d[bucket_name] = []
                for obj in bucket.objects.all():
                    size,power_label = self.format_bytes(obj.size)
                    d[bucket_name].append([obj.key,str(size)+' '+power_label,obj.last_modified.timestamp()])
        except Exception as e:
            print('other error',e)
            status = {'Error':{'Message':str(e)}}
            return status,''
        else:
            status = True
            return status,d

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
        
        
        try:
            file_size = self.s3resource.Object(bucket_name,remote_file).content_length
            self.s3resource.Bucket(bucket_name).download_file(remote_file,local_file,Callback=ProgressPercentage(file_size,remote_file,uuid,self.per))
        except botocore.exceptions.ClientError as e:
            print('Unexpected Error: %s' % e.response)
            status = e.response
            return status
        else:            
            return True

    def delete_file(self,bucket_name,file_name):
        result = self.s3resource.Object(bucket_name,file_name).delete()
        return result

    def update_info(self,accesskey,secretkey,endpoint):
        self.accesskey = accesskey
        self.secretkey = secretkey
        self.endpoint = endpoint
        self.session = Session(aws_access_key_id=self.accesskey,aws_secret_access_key=self.secretkey)
        self.s3resource = self.session.resource('s3',endpoint_url=self.endpoint)

    def format_bytes(self,size):
        # 2**10 = 1024
        power = 1024
        n = 0
        power_labels = {0 : 'B', 1: 'KiB', 2: 'MiB', 3: 'GiB', 4: 'TiB'}
        while size > power:
            size /= power
            n += 1
        return round(size,2), power_labels[n]