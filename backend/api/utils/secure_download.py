
import logging
from typing import Dict, List, Any, Optional
from flask import Blueprint, request, g
import pandas as pd
from io import BytesIO

from api.core import create_response, logger
from api.models import (
    Admin, MentorProfile, MenteeProfile, PartnerProfile,
    AppointmentRequest, NewMentorApplication, MenteeApplication, Hub, DirectMessage
)
from api.utils.require_auth import admin_only
from api.utils.secure_access_control import (
    require_data_access_level, require_export_permission,
    DataAccessLevel, secure_access_control, data_export_controller
)
from api.utils.data_protection import data_protection_manager
from api.utils.constants import Account, EDUCATION_LEVEL

secure_download = Blueprint("secure_download", __name__)

class SecureDataSanitizer:
   
    EXPORT_SCHEMAS = {
        'admin_full': {
            'include_all': True,
            'sensitive_fields': True,
            'personal_identifiers': True
        },
        'admin_basic': {
            'exclude_fields': ['social_security', 'passport_number', 'driver_license'],
            'sensitive_fields': True,
            'personal_identifiers': True
        },
        'support_basic': {
            'exclude_fields': [
                'social_security', 'passport_number', 'driver_license',
                'bank_account', 'credit_card', 'medical_info'
            ],
            'mask_fields': ['email', 'phone_number'],
            'sensitive_fields': False,
            'personal_identifiers': False
        },
        'minimal': {
            'include_fields': [
                'id', 'name', 'organization', 'role', 'created_at',
                'status', 'specializations', 'languages'
            ],
            'sensitive_fields': False,
            'personal_identifiers': False
        }
    }
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def get_export_schema(self, user_role: int, export_level: str = 'basic') -> Dict[str, Any]:
       
        if user_role == Account.ADMIN:
            return self.EXPORT_SCHEMAS.get(f'admin_{export_level}', self.EXPORT_SCHEMAS['admin_basic'])
        elif user_role == Account.SUPPORT:
            return self.EXPORT_SCHEMAS.get('support_basic', self.EXPORT_SCHEMAS['minimal'])
        else:
            return self.EXPORT_SCHEMAS['minimal']
    
    def sanitize_mentor_data(self, mentor: Any, schema: Dict[str, Any]) -> Dict[str, Any]:
        
        data = {
            'id': str(mentor.id),
            'name': mentor.name if schema.get('personal_identifiers', False) else '***RESTRICTED***',
            'email': self._mask_email(mentor.email) if 'email' in schema.get('mask_fields', []) else mentor.email,
            'professional_title': mentor.professional_title,
            'linkedin': mentor.linkedin if schema.get('sensitive_fields', False) else None,
            'website': mentor.website,
            'languages': ','.join(mentor.languages) if mentor.languages else '',
            'specializations': ','.join(mentor.specializations) if mentor.specializations else '',
            'biography': mentor.biography if schema.get('sensitive_fields', False) else None,
            'taking_appointments': 'Yes' if mentor.taking_appointments else 'No',
            'organization': getattr(mentor, 'organization', ''),
            'created_at': mentor.created_at if hasattr(mentor, 'created_at') else None
        }
        
        
        if schema.get('sensitive_fields', False):
            data.update({
                'phone_number': mentor.phone_number if hasattr(mentor, 'phone_number') else '',
                'address': mentor.address if hasattr(mentor, 'address') else '',
                'emergency_contact': mentor.emergency_contact if hasattr(mentor, 'emergency_contact') else ''
            })
        
      
        exclude_fields = schema.get('exclude_fields', [])
        for field in exclude_fields:
            data.pop(field, None)
        
        
        include_fields = schema.get('include_fields')
        if include_fields:
            data = {key: value for key, value in data.items() if key in include_fields}
        
        return data
    
    def sanitize_mentee_data(self, mentee: Any, schema: Dict[str, Any]) -> Dict[str, Any]:
        
        data = {
            'id': str(mentee.id),
            'name': mentee.name if schema.get('personal_identifiers', False) else '***RESTRICTED***',
            'email': self._mask_email(mentee.email) if 'email' in schema.get('mask_fields', []) else mentee.email,
            'gender': mentee.gender if hasattr(mentee, 'gender') else '',
            'age': mentee.age if hasattr(mentee, 'age') and schema.get('personal_identifiers', False) else None,
            'location': mentee.location if hasattr(mentee, 'location') else '',
            'languages': ','.join(mentee.languages) if mentee.languages else '',
            'specializations': ','.join(mentee.specializations) if mentee.specializations else '',
            'biography': mentee.biography if schema.get('sensitive_fields', False) else None,
            'organization': mentee.organization if hasattr(mentee, 'organization') else '',
            'created_at': mentee.created_at if hasattr(mentee, 'created_at') else None
        }
        
        
        if schema.get('sensitive_fields', False):
            data.update({
                'phone_number': mentee.phone_number if hasattr(mentee, 'phone_number') else '',
                'address': mentee.address if hasattr(mentee, 'address') else '',
                'date_of_birth': mentee.date_of_birth if hasattr(mentee, 'date_of_birth') else ''
            })
        
        
        exclude_fields = schema.get('exclude_fields', [])
        for field in exclude_fields:
            data.pop(field, None)
        
        
        include_fields = schema.get('include_fields')
        if include_fields:
            data = {key: value for key, value in data.items() if key in include_fields}
        
        return data
    
    def sanitize_partner_data(self, partner: Any, schema: Dict[str, Any]) -> Dict[str, Any]:
        
        data = {
            'id': str(partner.id),
            'organization': partner.organization,
            'email': self._mask_email(partner.email) if 'email' in schema.get('mask_fields', []) else partner.email,
            'location': partner.location if hasattr(partner, 'location') else '',
            'person_name': partner.person_name if schema.get('personal_identifiers', False) else '***RESTRICTED***',
            'website': partner.website if hasattr(partner, 'website') else '',
            'linkedin': partner.linkedin if hasattr(partner, 'linkedin') and schema.get('sensitive_fields', False) else '',
            'hub_user_name': getattr(partner, 'hub_user_name', ''),
            'created_at': partner.created_at if hasattr(partner, 'created_at') else None
        }
        
       
        if schema.get('sensitive_fields', False):
            data.update({
                'phone_number': partner.phone_number if hasattr(partner, 'phone_number') else '',
                'address': partner.address if hasattr(partner, 'address') else '',
                'contact_details': partner.contact_details if hasattr(partner, 'contact_details') else ''
            })
        
       
        exclude_fields = schema.get('exclude_fields', [])
        for field in exclude_fields:
            data.pop(field, None)
        
        
        include_fields = schema.get('include_fields')
        if include_fields:
            data = {key: value for key, value in data.items() if key in include_fields}
        
        return data
    
    def _mask_email(self, email: str) -> str:
        
        if not email or '@' not in email:
            return email
        
        local, domain = email.split('@', 1)
        if len(local) <= 2:
            masked_local = '*' * len(local)
        else:
            masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
        
        domain_parts = domain.split('.')
        if len(domain_parts) > 1:
            masked_domain = domain_parts[0][0] + '*' * (len(domain_parts[0]) - 1) + '.' + '.'.join(domain_parts[1:])
        else:
            masked_domain = domain
        
        return f"{masked_local}@{masked_domain}"

def generate_secure_sheet(sheet_name: str, data: List[Dict[str, Any]], user_role: int) -> Any:
   
    try:
        
        data_protection_manager.access_logger.log_bulk_export(
            export_type=sheet_name,
            record_count=len(data),
            export_level='secure',
            user_id=getattr(g, 'user_id', 'unknown')
        )
        
        
        df = pd.DataFrame(data)
        
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        output.seek(0)
        
        
        from flask import send_file
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'{sheet_name}_secure.xlsx'
        )
    
    except Exception as e:
        logger.error(f"Secure sheet generation failed: {str(e)}")
        return create_response(status=500, message="Export generation failed")

@secure_download.route("/secure/accounts/all", methods=["GET"])
@admin_only
@require_data_access_level(DataAccessLevel.RESTRICTED)
@require_export_permission("basic")
def secure_download_accounts():
    
    try:
        data = request.args
        account_type = int(data.get("account_type", 0))
        export_level = data.get("export_level", "basic")
        hub_user_id = data.get("hub_user_id")
        
      
        user_role = getattr(g, 'user_role', Account.MENTEE)
        
        
        if export_level == "full" and user_role != Account.ADMIN:
            return create_response(status=403, message="Full export requires admin privileges")
        
        
        sanitizer = SecureDataSanitizer()
        schema = sanitizer.get_export_schema(user_role, export_level)
        
        
        accounts = None
        admins = Admin.objects()
        admin_ids = [admin.firebase_uid for admin in admins]
        
        if account_type == Account.MENTOR:
            accounts = MentorProfile.objects(firebase_uid__nin=admin_ids)
            account_data = [
                sanitizer.sanitize_mentor_data(account, schema)
                for account in accounts
            ]
            sheet_name = "secure_mentors"
            
        elif account_type == Account.MENTEE:
            accounts = MenteeProfile.objects(firebase_uid__nin=admin_ids)
            account_data = [
                sanitizer.sanitize_mentee_data(account, schema)
                for account in accounts
            ]
            sheet_name = "secure_mentees"
            
        elif account_type == Account.PARTNER:
            if hub_user_id:
                accounts = PartnerProfile.objects.filter(
                    firebase_uid__nin=admin_ids, hub_id=hub_user_id
                )
            else:
                accounts = PartnerProfile.objects(firebase_uid__nin=admin_ids)
            
            account_data = [
                sanitizer.sanitize_partner_data(account, schema)
                for account in accounts
            ]
            sheet_name = "secure_partners"
        
        else:
            return create_response(status=400, message="Invalid account type")
        
        
        is_valid, message = secure_access_control.validate_bulk_access(user_role, len(account_data))
        if not is_valid:
            return create_response(status=403, message=message)
        
        
        sensitive_fields = ['email', 'phone_number', 'address'] if schema.get('sensitive_fields') else []
        secure_access_control.log_sensitive_access(
            action="BULK_DOWNLOAD",
            data_type=f"{sheet_name}_data",
            user_role=user_role,
            sensitive_fields=sensitive_fields
        )
        
        
        return generate_secure_sheet(sheet_name, account_data, user_role)
        
    except Exception as e:
        logger.error(f"Secure download failed: {str(e)}")
        return create_response(status=500, message="Download failed")

@secure_download.route("/secure/appointments/all", methods=["GET"])
@admin_only
@require_data_access_level(DataAccessLevel.INTERNAL)
@require_export_permission("basic")
def secure_download_appointments():
    
    try:
        user_role = getattr(g, 'user_role', Account.MENTEE)
        
        
        appointments = AppointmentRequest.objects()
        
        sanitizer = SecureDataSanitizer()
        schema = sanitizer.get_export_schema(user_role, "basic")
        
        appointment_data = []
        for appt in appointments:
            mentor = MentorProfile.objects(id=appt.mentor_id).first()
            mentee = MenteeProfile.objects(id=appt.mentee_id).first() if appt.mentee_id else None
            
            
            appt_data = {
                'appointment_id': str(appt.id),
                'mentor_name': mentor.name if mentor and schema.get('personal_identifiers') else '***RESTRICTED***',
                'mentor_email': sanitizer._mask_email(mentor.email) if mentor and 'email' in schema.get('mask_fields', []) else (mentor.email if mentor else ''),
                'start_time': appt.timeslot.start_time.strftime("UTC: %m/%d/%Y, %H:%M:%S"),
                'end_time': appt.timeslot.end_time.strftime("UTC: %m/%d/%Y, %H:%M:%S"),
                'status': 'Accepted' if appt.accepted else 'Pending',
                'topic': appt.topic if appt.topic else ','.join(appt.specialist_categories or []),
                'organization': (mentee.organization if mentee else appt.organization) if schema.get('sensitive_fields') else '***RESTRICTED***'
            }
            
            
            if mentee and schema.get('personal_identifiers'):
                appt_data.update({
                    'mentee_name': mentee.name,
                    'mentee_email': sanitizer._mask_email(mentee.email) if 'email' in schema.get('mask_fields', []) else mentee.email
                })
            elif schema.get('personal_identifiers'):
                appt_data.update({
                    'mentee_name': appt.name,
                    'mentee_email': sanitizer._mask_email(appt.email) if 'email' in schema.get('mask_fields', []) else appt.email
                })
            
            appointment_data.append(appt_data)
        
        
        is_valid, message = secure_access_control.validate_bulk_access(user_role, len(appointment_data))
        if not is_valid:
            return create_response(status=403, message=message)
        
        
        secure_access_control.log_sensitive_access(
            action="APPOINTMENT_DOWNLOAD",
            data_type="appointments",
            user_role=user_role,
            sensitive_fields=['email', 'name', 'organization']
        )
        
        return generate_secure_sheet("secure_appointments", appointment_data, user_role)
        
    except Exception as e:
        logger.error(f"Secure appointment download failed: {str(e)}")
        return create_response(status=500, message="Appointment download failed")

@secure_download.route("/secure/export/summary", methods=["GET"])
@admin_only
@require_data_access_level(DataAccessLevel.INTERNAL)
def get_export_summary():
    """Get summary of available exports for the user."""
    try:
        user_role = getattr(g, 'user_role', Account.MENTEE)
        permissions = secure_access_control.get_user_permissions(user_role)
        
        summary = {
            'user_role': user_role,
            'data_access_level': permissions['data_access'].value,
            'export_permission': permissions['export_permission'].value,
            'can_bulk_export': permissions['can_bulk_export'],
            'available_exports': []
        }
        
        
        if permissions['export_permission'].value != 'none':
            summary['available_exports'].extend([
                {
                    'name': 'Mentors (Basic)',
                    'endpoint': '/secure/accounts/all?account_type=0&export_level=basic',
                    'description': 'Basic mentor information with limited sensitive data'
                },
                {
                    'name': 'Mentees (Basic)',
                    'endpoint': '/secure/accounts/all?account_type=1&export_level=basic',
                    'description': 'Basic mentee information with limited sensitive data'
                },
                {
                    'name': 'Partners (Basic)',
                    'endpoint': '/secure/accounts/all?account_type=2&export_level=basic',
                    'description': 'Basic partner information'
                }
            ])
        
        if user_role == Account.ADMIN:
            summary['available_exports'].extend([
                {
                    'name': 'Full Account Data',
                    'endpoint': '/secure/accounts/all?export_level=full',
                    'description': 'Complete account data including sensitive fields (Admin only)'
                },
                {
                    'name': 'Appointments',
                    'endpoint': '/secure/appointments/all',
                    'description': 'Appointment data with privacy controls'
                }
            ])
        
        return create_response(data=summary)
        
    except Exception as e:
        logger.error(f"Export summary failed: {str(e)}")
        return create_response(status=500, message="Failed to get export summary")
