from django.urls import path
from .views import (
    system_metrics,
    docker_containers,
    trigger_deployment,
    deployment_history
)
from .webhook_view import github_webhook
from api.views import health_check

urlpatterns = [
    path('metrics/', system_metrics),
    path('containers/', docker_containers),
    path('deploy/', trigger_deployment),
    path('deployments/', deployment_history),
    path('health/', health_check),
    path('webhook/', github_webhook),
]
