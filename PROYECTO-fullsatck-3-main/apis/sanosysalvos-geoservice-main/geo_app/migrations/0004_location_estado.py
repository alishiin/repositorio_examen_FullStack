from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("geo_app", "0003_location_imagen_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="location",
            name="estado",
            field=models.CharField(
                choices=[
                    ("activo", "Activo"),
                    ("resuelto", "Resuelto"),
                    ("cerrado", "Cerrado"),
                ],
                default="activo",
                db_index=True,
                max_length=20,
                help_text=(
                    "Estado del reporte: activo (vigente), "
                    "resuelto (mascota encontrada/devuelta), cerrado"
                ),
            ),
        ),
    ]
