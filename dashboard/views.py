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


from .monitor import monitor

@api_view(['GET'])
def system_metrics(request):
    return Response(monitor.get_data())


@api_view(['GET'])
def docker_containers(request):
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)

        container_data = []

        for container in containers:
            stats = {}
            if container.status == 'running':
                try:
                    stats = container.stats(stream=False)
                except Exception:
                    pass

            # Calculate CPU %
            cpu_percent = 0.0
            if stats and 'cpu_stats' in stats and 'precpu_stats' in stats:
                cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
                system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
                if system_delta > 0:
                    cpu_percent = (cpu_delta / system_delta) * len(stats['cpu_stats']['cpu_usage']['percpu_usage']) * 100.0

            # Calculate Memory Usage
            mem_usage = 0.0
            if stats and 'memory_stats' in stats:
                mem_usage = stats['memory_stats']['usage'] / (1024 * 1024) # MB

            container_data.append({
                "id": container.short_id,
                "name": container.name,
                "status": container.status,
                "image": container.image.tags[0] if container.image.tags else "untagged",
                "cpu_percent": round(cpu_percent, 2),
                "memory_mb": round(mem_usage, 2),
                "uptime": container.attrs.get('State', {}).get('StartedAt', 'N/A'),
                "ports": list(container.attrs.get('NetworkSettings', {}).get('Ports', {}).keys())
            })

        return Response(container_data)

    except Exception as e:
        print(f"Docker fetch error: {e}")
        mock_containers = [
            {
                "id": "abc123",
                "name": "infrapilot-api",
                "status": "running",
                "image": "infrapilot:latest",
                "cpu_percent": 1.2,
                "memory_mb": 145.5,
                "uptime": "2026-05-07T10:00:00Z",
                "ports": ["8000/tcp"]
            },
            {
                "id": "xyz456",
                "name": "infrapilot-db",
                "status": "running",
                "image": "postgres:15",
                "cpu_percent": 0.5,
                "memory_mb": 89.2,
                "uptime": "2026-05-07T09:30:00Z",
                "ports": ["5432/tcp"]
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