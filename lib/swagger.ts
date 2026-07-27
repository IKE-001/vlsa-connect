// =============================================================================
// lib/swagger.ts
// Generates the OpenAPI spec for all VSLA Connect API endpoints.
// Served via GET /api/docs and rendered by the Swagger UI page.
// =============================================================================

export function getApiDocs() {
  const spec = {
      openapi: '3.0.0',
      info: {
        title: 'VSLA Connect API',
        version: '0.1.0',
        description:
          'API documentation for the VSLA Connect platform. All protected endpoints require the `x-caller-user-id` header to simulate an authenticated session during development.',
      },
      servers: [{ url: 'https://vlsa-connect.vercel.app' }],
      components: {
        securitySchemes: {
          CallerUserId: {
            type: 'apiKey',
            in: 'header',
            name: 'x-caller-user-id',
            description: 'Paste a valid User UUID here to authenticate requests',
          },
        },
        schemas: {
          // ── Groups ──────────────────────────────────────────────────────────
          CreateGroupBody: {
            type: 'object',
            required: ['name', 'contributionAmountTambala', 'interestRate'],
            properties: {
              name: { type: 'string', example: 'Mwana Uchumi VSLA' },
              description: { type: 'string', example: 'A group for market traders in Lilongwe.' },
              contributionAmountTambala: { type: 'integer', example: 50000, description: '500 MWK in tambala' },
              interestRate: { type: 'number', example: 10.0, description: 'Loan interest rate (%)' },
              loanMultipleCap: { type: 'number', example: 3.0 },
              withdrawalQuorumPct: { type: 'number', example: 50.0 },
              cycleFrequency: { type: 'string', enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'], example: 'MONTHLY' },
              meetingLocation: { type: 'string', example: 'Community Hall, Area 18' },
            },
          },
          JoinGroupBody: {
            type: 'object',
            required: ['inviteCode'],
            properties: {
              inviteCode: { type: 'string', minLength: 6, maxLength: 6, example: 'A3F9D1' },
            },
          },
          UpdateRoleBody: {
            type: 'object',
            required: ['role'],
            properties: {
              role: { type: 'string', enum: ['MEMBER', 'TREASURER', 'SECRETARY'] },
            },
          },
          UpdateStatusBody: {
            type: 'object',
            required: ['status'],
            properties: {
              status: { type: 'string', enum: ['SUSPENDED', 'REMOVED'] },
            },
          },
          TransferOwnershipBody: {
            type: 'object',
            required: ['newChairpersonId'],
            properties: {
              newChairpersonId: { type: 'string', format: 'uuid', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
            },
          },
          // ── Meetings ─────────────────────────────────────────────────────────
          ScheduleMeetingBody: {
            type: 'object',
            required: ['groupId', 'scheduledAt'],
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              scheduledAt: { type: 'string', format: 'date-time', example: '2026-08-15T09:00:00Z' },
              agenda: { type: 'string', example: 'Review July contributions and loan applications.' },
              location: { type: 'string', example: 'Nyumba ya Mtengo, Mzimba' },
            },
          },
          RecordAttendanceBody: {
            type: 'object',
            required: ['records'],
            properties: {
              records: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['memberId', 'status'],
                  properties: {
                    memberId: { type: 'string', format: 'uuid' },
                    status: { type: 'string', enum: ['PRESENT', 'ABSENT', 'EXCUSED'] },
                    note: { type: 'string', example: 'Medical leave' },
                  },
                },
              },
            },
          },
          UpdateMinutesBody: {
            type: 'object',
            required: ['minutes'],
            properties: {
              minutes: { type: 'string', example: 'Meeting opened at 9:00 AM. Contributions collected: MK 150,000...' },
            },
          },
          // ── Notifications ────────────────────────────────────────────────────
          UpdatePreferencesBody: {
            type: 'object',
            properties: {
              notifyInApp: { type: 'boolean', example: true },
              notifySms: { type: 'boolean', example: false },
              notifyEmail: { type: 'boolean', example: true },
            },
          },
          // ── Loans ────────────────────────────────────────────────────────────
          RequestLoanBody: {
            type: 'object',
            required: ['groupId', 'principalTambala'],
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              principalTambala: { type: 'integer', example: 150000, description: '1500 MWK in tambala' },
            },
          },
          VoteLoanBody: {
            type: 'object',
            required: ['voterId', 'decision'],
            properties: {
              voterId: { type: 'string', format: 'uuid' },
              decision: { type: 'string', enum: ['APPROVE', 'REJECT'] },
              note: { type: 'string', example: 'Member has a good repayment record.' },
            },
          },
          RepayLoanBody: {
            type: 'object',
            required: ['callerMemberId', 'amountTambala', 'method'],
            properties: {
              callerMemberId: { type: 'string', format: 'uuid' },
              amountTambala: { type: 'integer', example: 50000 },
              method: { type: 'string', enum: ['CASH', 'MOBILE_MONEY', 'CARD'] },
              idempotencyKey: { type: 'string', example: 'repay-abc-123' },
            },
          },
          // ── Withdrawals ───────────────────────────────────────────────────────
          WithdrawalRequestBody: {
            type: 'object',
            required: ['groupId', 'amountTambala', 'reason'],
            properties: {
              groupId: { type: 'string', format: 'uuid' },
              amountTambala: { type: 'integer', example: 200000 },
              reason: { type: 'string', example: 'Year-end distribution of shares.' },
            },
          },
          // ── Common ────────────────────────────────────────────────────────────
          SuccessResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'object' },
            },
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string' },
            },
          },
        },
      },
      security: [{ CallerUserId: [] }],
      tags: [
        { name: 'Groups', description: 'VSLA Group lifecycle and governance' },
        { name: 'Meetings', description: 'Meeting scheduling, attendance, and minutes' },
        { name: 'Loans', description: 'Loan requests, voting, disbursement, and repayment' },
        { name: 'Withdrawals', description: 'Withdrawal requests and voting' },
        { name: 'Ledger', description: 'Immutable financial audit trail' },
        { name: 'Health Score', description: 'Group health score snapshots and trends' },
        { name: 'Notifications', description: 'In-app notifications and user preferences' },
        { name: 'AI', description: 'Groq-powered chatbot and translation' },
        { name: 'Media', description: 'File and avatar uploads via Cloudinary' },
        { name: 'SMS', description: 'Africa\'s Talking SMS and USSD' },
        { name: 'Payments', description: 'PayChangu payment initiation and callbacks' },
      ],
      paths: {
        // ── GROUPS ──────────────────────────────────────────────────────────────
        '/api/groups': {
          get: {
            tags: ['Groups'],
            summary: 'List my groups',
            description: 'Returns all VSLA groups the authenticated user is a member of.',
            responses: {
              200: { description: 'List of groups', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
              401: { description: 'Unauthorized' },
            },
          },
          post: {
            tags: ['Groups'],
            summary: 'Create a group',
            description: 'Creates a new VSLA group. The caller is automatically set as Chairperson and a 6-character invite code is generated.',
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateGroupBody' } } } },
            responses: {
              201: { description: 'Group created' },
              400: { description: 'Validation error' },
            },
          },
        },
        '/api/groups/join': {
          post: {
            tags: ['Groups'],
            summary: 'Join a group via invite code',
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/JoinGroupBody' } } } },
            responses: {
              200: { description: 'Joined successfully' },
              404: { description: 'Invalid invite code or group is closed' },
            },
          },
        },
        '/api/groups/{id}': {
          get: {
            tags: ['Groups'],
            summary: 'Get group details',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
              200: { description: 'Group details with members' },
              403: { description: 'Forbidden — caller is not a member' },
              404: { description: 'Group not found' },
            },
          },
        },
        '/api/groups/{id}/leave': {
          post: {
            tags: ['Groups'],
            summary: 'Leave a group',
            description: 'A member voluntarily exits the group. Blocked if they have outstanding loans.',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
              200: { description: 'Left successfully' },
              500: { description: 'Blocked — outstanding loans exist' },
            },
          },
        },
        '/api/groups/{id}/transfer-ownership': {
          post: {
            tags: ['Groups'],
            summary: 'Transfer Chairperson role',
            description: 'The current Chairperson transfers their role to another active member.',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TransferOwnershipBody' } } } },
            responses: { 200: { description: 'Ownership transferred' }, 403: { description: 'Not Chairperson' } },
          },
        },
        '/api/groups/{id}/members/{memberId}/role': {
          patch: {
            tags: ['Groups'],
            summary: 'Update member role',
            description: 'Chairperson promotes or demotes a member to TREASURER or SECRETARY.',
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
              { name: 'memberId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateRoleBody' } } } },
            responses: { 200: { description: 'Role updated' }, 403: { description: 'Forbidden' } },
          },
        },
        '/api/groups/{id}/members/{memberId}/status': {
          patch: {
            tags: ['Groups'],
            summary: 'Kick or suspend a member',
            description: 'Chairperson removes or suspends a member. Blocked if member has outstanding loans.',
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
              { name: 'memberId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            ],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateStatusBody' } } } },
            responses: { 200: { description: 'Status updated' }, 403: { description: 'Forbidden' } },
          },
        },
        // ── MEETINGS ─────────────────────────────────────────────────────────
        '/api/meetings': {
          get: {
            tags: ['Meetings'],
            summary: 'List group meetings',
            parameters: [{ name: 'groupId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'List of meetings with attendance' }, 400: { description: 'groupId is required' } },
          },
          post: {
            tags: ['Meetings'],
            summary: 'Schedule a meeting',
            description: 'Only Chairperson or Secretary can schedule meetings.',
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ScheduleMeetingBody' } } } },
            responses: { 201: { description: 'Meeting scheduled' }, 403: { description: 'Forbidden' } },
          },
        },
        '/api/meetings/{id}/attendance': {
          post: {
            tags: ['Meetings'],
            summary: 'Record batch attendance',
            description: 'Upserts attendance records for multiple members in a single transaction.',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordAttendanceBody' } } } },
            responses: { 200: { description: 'Attendance recorded' }, 403: { description: 'Forbidden' } },
          },
        },
        '/api/meetings/{id}/minutes': {
          patch: {
            tags: ['Meetings'],
            summary: 'Update meeting minutes',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMinutesBody' } } } },
            responses: { 200: { description: 'Minutes updated' }, 403: { description: 'Forbidden' } },
          },
        },
        // ── NOTIFICATIONS ─────────────────────────────────────────────────────
        '/api/notifications': {
          get: {
            tags: ['Notifications'],
            summary: 'Get my notifications',
            parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }],
            responses: { 200: { description: 'List of in-app notifications' } },
          },
        },
        '/api/notifications/preferences': {
          get: {
            tags: ['Notifications'],
            summary: 'Get notification preferences',
            responses: { 200: { description: 'Current channel toggles' } },
          },
          patch: {
            tags: ['Notifications'],
            summary: 'Update notification preferences',
            description: 'Toggle SMS, Email, or In-App notifications on or off.',
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePreferencesBody' } } } },
            responses: { 200: { description: 'Preferences updated' } },
          },
        },
        '/api/notifications/{id}/read': {
          post: {
            tags: ['Notifications'],
            summary: 'Mark notification as read',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'Marked as read' }, 404: { description: 'Notification not found' } },
          },
        },
        // ── LOANS ─────────────────────────────────────────────────────────────
        '/api/loans': {
          post: {
            tags: ['Loans'],
            summary: 'Request a loan',
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RequestLoanBody' } } } },
            responses: { 201: { description: 'Loan request created' } },
          },
        },
        '/api/loans/{id}/vote': {
          post: {
            tags: ['Loans'],
            summary: 'Vote on a loan',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VoteLoanBody' } } } },
            responses: { 200: { description: 'Vote recorded' } },
          },
        },
        '/api/loans/{id}/disburse': {
          post: {
            tags: ['Loans'],
            summary: 'Disburse an approved loan',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Loan disbursed, ledger entry created' } },
          },
        },
        '/api/loans/{id}/repay': {
          post: {
            tags: ['Loans'],
            summary: 'Make a loan repayment',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RepayLoanBody' } } } },
            responses: { 200: { description: 'Repayment recorded' } },
          },
        },
        '/api/loans/{id}/repayments': {
          get: {
            tags: ['Loans'],
            summary: 'List repayments for a loan',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'List of repayments' } },
          },
        },
        // ── WITHDRAWALS ───────────────────────────────────────────────────────
        '/api/withdrawals': {
          post: {
            tags: ['Withdrawals'],
            summary: 'Request a withdrawal',
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WithdrawalRequestBody' } } } },
            responses: { 201: { description: 'Withdrawal request created' } },
          },
        },
        '/api/withdrawals/{id}/vote': {
          post: {
            tags: ['Withdrawals'],
            summary: 'Vote on a withdrawal',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VoteLoanBody' } } } },
            responses: { 200: { description: 'Vote recorded' } },
          },
        },
        '/api/withdrawals/{id}/resolve': {
          post: {
            tags: ['Withdrawals'],
            summary: 'Resolve a withdrawal (pay out or reject)',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Withdrawal resolved' } },
          },
        },
        // ── LEDGER ────────────────────────────────────────────────────────────
        '/api/ledger/{groupId}': {
          get: {
            tags: ['Ledger'],
            summary: 'Get group ledger',
            description: 'Returns the immutable financial audit trail for a group.',
            parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'List of ledger entries ordered newest first' } },
          },
        },
        // ── HEALTH SCORE ──────────────────────────────────────────────────────
        '/api/health-score/{groupId}': {
          get: {
            tags: ['Health Score'],
            summary: 'Get latest health score',
            parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Latest computed health score snapshot' } },
          },
        },
        '/api/health-score/{groupId}/trend': {
          get: {
            tags: ['Health Score'],
            summary: 'Get health score history',
            parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Historical health score snapshots' } },
          },
        },
        // ── AI ────────────────────────────────────────────────────────────────
        '/api/ai/chat': {
          post: {
            tags: ['AI'],
            summary: 'Chat with the AI assistant (Groq/Llama 3.3)',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'How do I request a loan?' }, lang: { type: 'string', enum: ['en', 'ny'], example: 'en' } } } } },
            },
            responses: { 200: { description: 'AI response' } },
          },
        },
        '/api/ai/translate': {
          post: {
            tags: ['AI'],
            summary: 'Translate text between English and Chichewa',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { type: 'object', properties: { text: { type: 'string' }, targetLang: { type: 'string', enum: ['en', 'ny'] } } } } },
            },
            responses: { 200: { description: 'Translated text' } },
          },
        },
        // ── MEDIA ─────────────────────────────────────────────────────────────
        '/api/media/upload': {
          post: {
            tags: ['Media'],
            summary: 'Upload a file to Cloudinary',
            requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } },
            responses: { 200: { description: 'Cloudinary URL returned' } },
          },
        },
        // ── SMS ───────────────────────────────────────────────────────────────
        '/api/sms/send': {
          post: {
            tags: ['SMS'],
            summary: 'Send an SMS via Africa\'s Talking',
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { type: 'object', properties: { to: { type: 'array', items: { type: 'string' }, example: ['+265888123456'] }, message: { type: 'string', example: 'Your loan of MK 5,000 has been approved.' } } } } },
            },
            responses: { 200: { description: 'SMS sent' } },
          },
        },
        '/api/sms/ussd': {
          post: {
            tags: ['SMS'],
            summary: 'USSD session handler (Africa\'s Talking webhook)',
            responses: { 200: { description: 'USSD response string' } },
          },
        },
        // ── PAYMENTS ──────────────────────────────────────────────────────────
        '/api/payments/initiate': {
          post: {
            tags: ['Payments'],
            summary: 'Initiate a PayChangu payment',
            responses: { 200: { description: 'Payment link returned' } },
          },
        },
        '/api/payments/callback': {
          post: {
            tags: ['Payments'],
            summary: 'PayChangu payment webhook callback',
            responses: { 200: { description: 'Webhook processed' } },
          },
        },
        '/api/payments/verify': {
          get: {
            tags: ['Payments'],
            summary: 'Verify a payment status',
            parameters: [{ name: 'reference', in: 'query', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'Payment status' } },
          },
        },
      },
    };

  return spec;
}
