from rest_framework.decorators import api_view
from rest_framework.response import Response
import psutil
import docker
from .models import Deployment
import random


@api_view(['GET'])
def health_check(request):
    return Response({
        "status": "InfraPilot API Running"
    })


@api_view(['GET'])
def system_metrics(request):
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    network = psutil.net_io_counters()

    data = {
        "cpu_usage_percent": psutil.cpu_percent(interval=1),
        "memory_usage_percent": memory.percent,
        "memory_available_gb": round(memory.available / (1024 ** 3), 2),
        "disk_usage_percent": disk.percent,
        "network_in_mb": round(network.bytes_recv / (1024 ** 2), 2),
        "network_out_mb": round(network.bytes_sent / (1024 ** 2), 2),
    }

    return Response(data)


@api_view(['GET'])
def docker_containers(request):
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)

        container_data = []

        for container in containers:
            container_data.append({
                "id": container.short_id,
                "name": container.name,
                "status": container.status,
                "image": container.image.tags
            })

        return Response(container_data)

    except Exception:
        mock_containers = [
            {
                "id": "abc123",
                "name": "infrapilot",
                "status": "running",
                "image": ["infrapilot:latest"]
            },
            {
                "id": "xyz456",
                "name": "postgres-db",
                "status": "running",
                "image": ["postgres:15"]
            }
        ]

        return Response(mock_containers)


@api_view(['GET'])
def deployment_history(request):
    deployments = [
        {
            "id": 1,
            "version": "v2.4.1",
            "service": "api-server",
            "status": "SUCCESS",
            "deployed_at": "2026-05-07T15:30:00Z",
            "logs": "Build started...\nTests passed\nDeployed to EC2"
        },
        {
            "id": 2,
            "version": "v2.4.0",
            "service": "nginx-proxy",
            "status": "FAILED",
            "deployed_at": "2026-05-07T14:10:00Z",
            "logs": "Build started...\nError: Port 80 in use\nRollback initiated"
        },
        {
            "id": 3,
            "version": "v2.3.9",
            "service": "worker-queue",
            "status": "SUCCESS",
            "deployed_at": "2026-05-07T12:45:00Z",
            "logs": "Build started...\nWorker synchronized\nHealthy"
        }
    ]

    return Response(deployments)


@api_view(['POST'])
def trigger_deployment(request):
    statuses = ['SUCCESS', 'FAILED']

    deployment = Deployment.objects.create(
        project_name="InfraPilot",
        version=f"v1.{random.randint(0,9)}",
        status=random.choice(statuses),
        logs="""
Pulling latest code...
Building Docker image...
Running tests...
Deploying containers...
Deployment completed.
"""
    )

    return Response({
        "message": "Deployment Triggered",
        "deployment_id": deployment.id,
        "status": deployment.status
    })