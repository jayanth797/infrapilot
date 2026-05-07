import hmac
import hashlib
import os
import subprocess
from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def github_webhook(request):
    # In a real production environment, you should verify the signature
    # for security. For this demo, we'll proceed if the header is present.
    
    event = request.META.get('HTTP_X_GITHUB_EVENT', 'ping')
    
    if event == 'push':
        try:
            # Trigger the deployment script
            # Note: Using absolute path is safer in production
            subprocess.Popen(['/home/jay/InfraPilot/deploy.sh'], shell=True)
            return Response({"status": "Deployment triggered"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
            
    return Response({"status": "Ignored event"}, status=200)
