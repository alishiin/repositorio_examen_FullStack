from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notification_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='read',
            field=models.BooleanField(default=False, help_text='Marca si el usuario ya vio la notificacion'),
        ),
    ]
