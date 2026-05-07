import subprocess
from django.core.management.base import BaseCommand
from dashboard.models import Deployment
from django.utils import timezone

class Command(BaseCommand):
    help = 'Automatically track deployments based on Git commits'

    def handle(self, *args, **options):
        try:
            # 1. Get latest commit hash
            commit_hash = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode('utf-8').strip()
            
            # 2. Get latest commit message
            commit_message = subprocess.check_output(['git', 'log', '-1', '--pretty=%B']).decode('utf-8').strip()

            # 3. Check for duplicates
            if Deployment.objects.filter(commit_hash=commit_hash).exists():
                self.stdout.write(self.style.WARNING(f'Deployment for commit {commit_hash} already exists. Skipping.'))
                return

            # 4. Create deployment record
            # We'll use a version format like v2.5.<increment> or just v2.5.{hash}
            version = f"v2.5.{commit_hash}"
            
            Deployment.objects.create(
                service="InfraPilot Backend",
                version=version,
                status="SUCCESS",
                logs=commit_message,
                commit_hash=commit_hash
            )

            self.stdout.write(self.style.SUCCESS(f'Successfully tracked deployment for commit {commit_hash}'))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error tracking deployment: {str(e)}'))
