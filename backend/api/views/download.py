import pandas as pd
import xlsxwriter
from io import BytesIO
from api.core import create_response
from api.models import AppointmentRequest, Users
from flask import send_file, Blueprint

download = Blueprint("download", __name__)

@download.route("/appointments/all", methods=["GET"])
def download_appointments():
    try:
        appointments = AppointmentRequest.objects()
    except:
        msg = "Failed to get appointments"
        logger.info(msg)
        return create_response(status=422, message=msg)

    appts = []
    for appt in appointments:
        appts.append([appt.timeslot.start_time.strftime("%m/%d/%Y, %H:%M:%S"), appt.timeslot.end_time.strftime("%m/%d/%Y, %H:%M:%S"), appt.accepted, appt.name, appt.email, appt.phone_number, ",".join(appt.languages), appt.age, appt.gender, appt.location, ",".join(appt.specialist_categories), appt.message, appt.organization, appt.allow_calls, appt.allow_texts])
    df = pd.DataFrame(appts, columns=["timeslot.start_time", "timeslot.end_time", "accepted", "name", "email", "phone_number", "languages", "age", "gender", "location", "specialist_categories", "message", "organization", "allow_calls", "allow_texts"])
    output = BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    
    df.to_excel(writer, startrow = 0, merge_cells = False, sheet_name= "Appointments", index=False)
    workbook = writer.book
    worksheet = writer.sheets["Appointments"]
    format = workbook.add_format()
    format.set_bg_color('#eeeeee')
    worksheet.set_column(0,len(appts[0]),28)

    writer.close()
    output.seek(0)

    try:
        return send_file(output, attachment_filename="appts.xlsx", as_attachment=True)
    except FileNotFoundError:
        msg = "Download failed"
        logger.info(msg)
        return create_response(status=422, message=msg)

@download.route("/accounts/all", methods=["GET"])
def download_accounts_info():
    try:
        accounts = Users.objects(role__ne="admin")
    except:
        msg = "Failed to get accounts"
        logger.info(msg)
        return create_response(status=422, message=msg)

    accts = []
    for acct in accounts:
        accts.append([acct.email, acct.password, acct.role, acct.verified, acct.pin, acct.expiration.strftime("%m/%d/%Y, %H:%M:%S"), acct.mongooseVersion])
    df = pd.DataFrame(accts, columns=["email", "password", "role", "verified", "pin", "expiration", "Mongoose version"])
    output = BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    
    df.to_excel(writer, startrow = 0, merge_cells = False, sheet_name= "Accounts", index=False)
    workbook = writer.book
    worksheet = writer.sheets["Accounts"]
    format = workbook.add_format()
    format.set_bg_color('#eeeeee')
    worksheet.set_column(0,len(accts[0]),28)

    writer.close()
    output.seek(0)

    return send_file(output, attachment_filename="accounts.xlsx", as_attachment=True)

