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
import time
import boto3
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
        self.mpu_id = {}
        self.parts = {}
        #boto3.set_stream_logger()
        #botocore.session.Session().set_debug_logger()
        self.session = Session(aws_access_key_id=self.accesskey,aws_secret_access_key=self.secretkey)
        self.s3resource = self.session.resource('s3',endpoint_url=self.endpoint,region_name='us-east-1')
        self.s3client = self.s3resource.meta.client

    def init_env(self,bucket_name,uuid,file_name,op):
        if op == 'download':
            self.per[uuid] = {'file_name':file_name,'p':0}
        if op == 'upload':
            self.parts[uuid] = []
            self.mpu_id[uuid] = self.s3client.create_multipart_upload(Bucket=bucket_name, Key=file_name)
            #print('mpu_id=',self.mpu_id[uuid]['UploadId'],' ',file_name)
    
    def init_test(self):
        print(self.s3client.list_buckets())

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
        object_list = []
        try:
            bucket = self.s3resource.Bucket(bucket_name)
            for obj in bucket.objects.all():
                #object_list[obj.key] = obj.size
                size,power_label = self.format_bytes(obj.size)
                object_list.append([obj.key,obj.key,str(size)+' '+power_label,obj.last_modified.timestamp()])
        except Exception as e:
            print('other error',e)
            status = {'Error':{'Message':str(e)}}
            return status,''
        else:
            status = True
            return status,object_list

    def get_object_info(self):
        d = {}
        d_size = {}
        d_size_num = {}
        d_last = {}
        d_last_num = {}
        k = 1024
        m = k*1024
        g = m*1024
        size_list = [m,m*10,m*100,g]
        
        hour = 60*60
        day = hour*24
        week = day*7
        month = day*30
        year = day*365
        last_list = [hour,day,week,month]
        now = int(time.time())
        total_size = [0,0,0,0,0,0]
        total_size_num = [0,0,0,0,0,0]
        total_last = [0,0,0,0,0,0]
        total_last_num = [0,0,0,0,0,0]

        try:
            status, bucket_list = self.list_bucket()
            for bucket_name in bucket_list:
                bucket = self.s3resource.Bucket(bucket_name)
                d_size[bucket_name] = [0,0,0,0,0,0]
                d_last[bucket_name] = [0,0,0,0,0,0]
                d_size_num[bucket_name] = [0,0,0,0,0,0]
                d_last_num[bucket_name] = [0,0,0,0,0,0]
                for obj in bucket.objects.all():
                    if obj.size <= size_list[0]:
                        d_size[bucket_name][0] += obj.size
                        d_size_num[bucket_name][0] += 1
                        total_size[0] += obj.size
                        total_size_num[0] += 1
                    elif size_list[0] < obj.size <= size_list[1]:
                        d_size[bucket_name][1] += obj.size
                        d_size_num[bucket_name][1] += 1
                        total_size[1] += obj.size
                        total_size_num[1] += 1
                    elif size_list[1] < obj.size <= size_list[2]:
                        d_size[bucket_name][2] += obj.size
                        d_size_num[bucket_name][2] += 1
                        total_size[2] += obj.size
                        total_size_num[2] += 1
                    elif size_list[2] < obj.size <= size_list[3]:
                        d_size[bucket_name][3] += obj.size
                        d_size_num[bucket_name][3] += 1
                        total_size[3] += obj.size
                        total_size_num[3] += 1
                    else:
                        d_size[bucket_name][4] += obj.size
                        d_size_num[bucket_name][4] += 1
                        total_size[4] += obj.size
                        total_size_num[4] += 1
                    
                    diff = now - obj.last_modified.timestamp()
                    
                    if diff <= last_list[0]:
                        d_last[bucket_name][0] += obj.size
                        d_last_num[bucket_name][0] += 1
                        total_last[0] += obj.size
                        total_last_num[0] += 1
                    elif last_list[0] < diff <= last_list[1]:
                        d_last[bucket_name][1] += obj.size
                        d_last_num[bucket_name][1] += 1
                        total_last[1] += obj.size
                        total_last_num[1] += 1
                    elif last_list[1] < diff <= last_list[2]:
                        d_last[bucket_name][2] += obj.size
                        d_last_num[bucket_name][2] += 1
                        total_last[2] += obj.size
                        total_last_num[2] += 1
                    elif last_list[2] < diff <= last_list[3]:
                        d_last[bucket_name][3] += obj.size
                        d_last_num[bucket_name][3] += 1
                        total_last[3] += obj.size
                        total_last_num[3] += 1
                    else:
                        d_last[bucket_name][4] += obj.size
                        d_last_num[bucket_name][4] += 1
                        total_last[4] += obj.size
                        total_last_num[4] += 1

        except Exception as e:
            print('other error',e)
            status = {'Error':{'Message':str(e)}}
            return status,''
        else:
            status = True
            d = {'total_size':total_size,'total_size_num':total_size_num,'total_last':total_last,'total_last_num':total_last_num}
            for key in d:
                for val in d[key]:
                    d[key][5] += val
                d[key][5] = d[key][5] / 2

            return status,d

    def multi_upload(self,bucket_name,file_name,filepath,uuid,i):
        #print('multi_upload ',filepath,' ',i)
        with open(filepath,'rb') as f:
            data = f.read()
            #print(filepath,' ',len(data))
            part = self.s3client.upload_part(Body=data, Bucket=bucket_name, Key=file_name, UploadId=self.mpu_id[uuid]['UploadId'], PartNumber=int(i)+1)
            self.parts[uuid].append({"PartNumber": int(i)+1, "ETag": part["ETag"]})
            os.remove(filepath)
        return ''
    
    def complete(self,bucket_name,file_name,uuid):
        self.parts[uuid].sort(key=lambda x: x['PartNumber'])
        #print('complete ',file_name,' ',self.parts[uuid])
        result = self.s3client.complete_multipart_upload(
        Bucket=bucket_name,
        Key=file_name,
        UploadId=self.mpu_id[uuid]['UploadId'],
        MultipartUpload={"Parts": self.parts[uuid]})
        return result
        
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
        self.s3resource = self.session.resource('s3',endpoint_url=self.endpoint,region_name='us-east-1')
        self.s3client = self.s3resource.meta.client

    def format_bytes(self,size):
        # 2**10 = 1024
        power = 1024
        n = 0
        power_labels = {0 : 'B', 1: 'KiB', 2: 'MiB', 3: 'GiB', 4: 'TiB'}
        while size > power:
            size /= power
            n += 1
        return round(size,2), power_labels[n]