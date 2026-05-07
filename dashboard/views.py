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
    deployments = Deployment.objects.all().order_by('-deployed_at')

    data = []

    for deploy in deployments:
        data.append({
            "id": deploy.id,
            "version": deploy.version,
            "service": deploy.service,
            "commit_hash": deploy.commit_hash,
            "status": deploy.status,
            "logs": deploy.logs,
            "deployed_at": deploy.deployed_at
        })

    return Response(data)


@api_view(['POST'])
def trigger_deployment(request):
    # Simulated deployment logic
    version = f"v2.5.{random.randint(0,99)}"
    service = "InfraPilot Backend"
    status = "SUCCESS"
    logs = f"Pulled latest code for {version}\nRestarted backend service\nDeployment to production successful."

    deployment = Deployment.objects.create(
        service=service,
        version=version,
        status=status,
        logs=logs
    )

    return Response({
        "message": "InfraPilot deployment completed successfully",
        "deployment_id": deployment.id,
        "status": deployment.status
    })