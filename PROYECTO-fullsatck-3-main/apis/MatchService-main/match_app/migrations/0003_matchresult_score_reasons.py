from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("match_app", "0002_alter_report_id_to_charfield"),
    ]

    operations = [
        migrations.AddField(
            model_name="matchresult",
            name="score",
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name="matchresult",
            name="reasons",
            field=models.JSONField(default=list),
        ),
        migrations.AlterUniqueTogether(
            name="matchresult",
            unique_together={("lost_report_id", "found_report_id")},
        ),
    ]
