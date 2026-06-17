# Generated manually for adding imagen_url field to Location (FASE 1A integration with Media Service)
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('geo_app', '0002_alter_location_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='imagen_url',
            field=models.URLField(
                blank=True,
                null=True,
                max_length=500,
                help_text='URL de la imagen del reporte (Media Service)',
            ),
        ),
    ]
