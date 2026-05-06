from rest_framework.decorators import api_view
from rest_framework.response import Response
import psutil
import docker
from .models import Deployment
import random

@api_view(['GET'])
def system_metrics(request):
    """
    Returns real-time system metrics: CPU usage and Memory usage.
    """
    metrics = {
        "cpu_usage_percent": psutil.cpu_percent(interval=1),
        "memory_usage_percent": psutil.virtual_memory().percent,
        "memory_available_gb": round(psutil.virtual_memory().available / (1024 ** 3), 2)
    }
    return Response(metrics)

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
    except Exception as e:
        return Response({
            "error": "Docker Connection Error",
            "message": str(e),
            "tip": "Ensure the user has permissions to access /var/run/docker.sock (e.g., 'sudo usermod -aG docker $USER')"
        }, status=500)

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

@api_view(['GET'])
def deployment_history(request):
    deployments = Deployment.objects.all().order_by('-deployed_at')
    data = []

    for deploy in deployments:
        data.append({
            "id": deploy.id,
            "project_name": deploy.project_name,
            "version": deploy.version,
            "status": deploy.status,
            "logs": deploy.logs,
            "deployed_at": deploy.deployed_at
        })

    return Response(data)
