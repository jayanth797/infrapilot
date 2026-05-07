import subprocess
from django.core.management.base import BaseCommand
from dashboard.models import Deployment

class Command(BaseCommand):
    help = 'Tracks the latest Git commit as a deployment'

    def handle(self, *args, **options):
        try:
            # 1. Fetch latest Git commit details
            commit_message = subprocess.check_output(['git', 'log', '-1', '--pretty=%B']).decode('utf-8').strip()
            commit_hash = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode('utf-8').strip()
            
            # 2. Check if this commit has already been tracked
            if Deployment.objects.filter(commit_hash=commit_hash).exists():
                self.stdout.write(self.style.WARNING(f"Deployment for commit {commit_hash} already exists."))
                return

            # 3. Determine version (use hash or increment)
            # For simplicity and uniqueness, we'll use a count-based versioning
            count = Deployment.objects.count() + 1
            version = f"v2.5.{count}"

            # 4. Create Deployment record
            Deployment.objects.create(
                service="InfraPilot Backend",
                version=version,
                commit_hash=commit_hash,
                status="SUCCESS",
                logs=commit_message
            )

            self.stdout.write(self.style.SUCCESS(f"Successfully tracked deployment: {version} ({commit_hash})"))
            
        except subprocess.CalledProcessError as e:
            self.stdout.write(self.style.ERROR(f"Git error: {e}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
