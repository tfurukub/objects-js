From python:3.7.5-slim
RUN pip install flask==1.1.1 tinydb==3.15.2 boto3==1.12.8
ADD ./src /src
WORKDIR /src
ENV PORT=80
ENV DEBUG=False
ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["python", "-u", "server.py"]