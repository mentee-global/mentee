from apscheduler.schedulers.blocking import BlockingScheduler

sched = BlockingScheduler()


@sched.scheduled_job('cron', day_of_week='mon', hour=17)
def scheduled_job():

    print('This job is run every monday at 5pm.')


sched.start()
