import { D1Database } from '@cloudflare/workers-types';
import { AuthUser } from '../auth';

export class WorkflowEngine {
  constructor(private db: D1Database) {}

  static canUserPerformAction(request: any, user: AuthUser | null): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;

    if (!request || request.status === 'completed' || request.status === 'rejected') {
      return false;
    }

    if (request.status === 'manager_approval') {
      const isInterUnit = Boolean(
        request.ticket_no?.startsWith('IU') ||
        request.request_type === 'inter_unit' ||
        (request.additional_data && (typeof request.additional_data === 'object' ? request.additional_data.is_inter_unit : String(request.additional_data).includes('is_inter_unit')))
      );

      if (isInterUnit) {
        const userManagedUnits: string[] = (user as any).managed_units || (user.unit ? [user.unit] : []);
        const userManagedUnitIds: number[] = (user as any).managed_unit_ids || ((user as any).unit_id ? [(user as any).unit_id] : []);

        const isTargetUnitHead = Boolean((user as any).is_unit_head) && (
          (request.unit_id && userManagedUnitIds.includes(Number(request.unit_id))) ||
          (request.unit && userManagedUnits.some((u: string) => u.toLowerCase().trim() === request.unit.toLowerCase().trim())) ||
          (request.unit_id && (user as any).unit_id && String((user as any).unit_id) === String(request.unit_id)) ||
          (request.unit && user.unit && user.unit.toLowerCase().trim() === request.unit.toLowerCase().trim())
        );
        // Inter-Unit jobs: ONLY admin, target unit head, or acting manager can Accept/Reject
        // Regular managers are excluded — this is a Head Unit to Head Unit collaboration
        return user.role === 'admin' || Boolean((user as any).is_acting_manager) || isTargetUnitHead;
      }

      // Online client requests: ONLY Manager, Admin, or Acting Manager has approval authority
      return user.role === 'manager' || user.role === 'admin' || Boolean((user as any).is_acting_manager);
    }

    if (request.status === 'staff_processing') {
      return user.role === 'staff' || user.role === 'manager' || user.role === 'admin';
    }

    return true;
  }

  async start(entityType: string, entityId: number, workflowCode: string, actorUserId: number | null = null) {
    const workflow = await this.db
      .prepare('SELECT * FROM workflows WHERE code = ? AND is_active = 1')
      .bind(workflowCode)
      .first<{ id: number }>();

    if (!workflow) throw new Error('Workflow not found');

    const firstStep = await this.db
      .prepare('SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_order ASC LIMIT 1')
      .bind(workflow.id)
      .first<{ id: number; step_key: string }>();

    if (!firstStep) throw new Error('Initial workflow step not found');

    await this.db
      .prepare('UPDATE job_requests SET workflow_id = ?, current_step_id = ?, status = ? WHERE id = ?')
      .bind(workflow.id, firstStep.id, firstStep.step_key, entityId)
      .run();

    await this.db
      .prepare(
        `INSERT INTO approvals (workflow_id, step_id, entity_type, entity_id, action, from_step_id, to_step_id, actor_user_id, comment, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(workflow.id, firstStep.id, entityType, entityId, 'submit', null, firstStep.id, actorUserId, 'Initial submission')
      .run();

    return true;
  }

  async approve(entityType: string, entityId: number, actorUserId: number, comment: string | null = null, action = 'approve') {
    const entity = await this.db
      .prepare('SELECT * FROM job_requests WHERE id = ?')
      .bind(entityId)
      .first<{ workflow_id: number; current_step_id: number }>();

    if (!entity) throw new Error('Job request not found');

    const currentStep = await this.db
      .prepare('SELECT * FROM workflow_steps WHERE id = ?')
      .bind(entity.current_step_id)
      .first<{ id: number; on_approve_next_step_id: number | null }>();

    if (!currentStep || !currentStep.on_approve_next_step_id) {
      throw new Error('No next step defined for approval');
    }

    const nextStep = await this.db
      .prepare('SELECT * FROM workflow_steps WHERE id = ?')
      .bind(currentStep.on_approve_next_step_id)
      .first<{ id: number; step_key: string }>();

    if (!nextStep) throw new Error('Next step target not found');

    await this.db
      .prepare('UPDATE job_requests SET current_step_id = ?, status = ? WHERE id = ?')
      .bind(nextStep.id, nextStep.step_key, entityId)
      .run();

    await this.db
      .prepare(
        `INSERT INTO approvals (workflow_id, step_id, entity_type, entity_id, action, from_step_id, to_step_id, actor_user_id, comment, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(entity.workflow_id, currentStep.id, entityType, entityId, action, currentStep.id, nextStep.id, actorUserId, comment)
      .run();
  }

  async reject(entityType: string, entityId: number, actorUserId: number, comment: string | null = null) {
    const entity = await this.db
      .prepare('SELECT * FROM job_requests WHERE id = ?')
      .bind(entityId)
      .first<{ workflow_id: number; current_step_id: number }>();

    if (!entity) throw new Error('Job request not found');

    const currentStep = await this.db
      .prepare('SELECT * FROM workflow_steps WHERE id = ?')
      .bind(entity.current_step_id)
      .first<{ id: number; on_reject_step_id: number | null }>();

    if (!currentStep || !currentStep.on_reject_step_id) {
      throw new Error('No rejection step defined');
    }

    const nextStep = await this.db
      .prepare('SELECT * FROM workflow_steps WHERE id = ?')
      .bind(currentStep.on_reject_step_id)
      .first<{ id: number; step_key: string }>();

    if (!nextStep) throw new Error('Rejection step target not found');

    await this.db
      .prepare('UPDATE job_requests SET current_step_id = ?, status = ? WHERE id = ?')
      .bind(nextStep.id, nextStep.step_key, entityId)
      .run();

    await this.db
      .prepare(
        `INSERT INTO approvals (workflow_id, step_id, entity_type, entity_id, action, from_step_id, to_step_id, actor_user_id, comment, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(entity.workflow_id, currentStep.id, entityType, entityId, 'reject', currentStep.id, nextStep.id, actorUserId, comment)
      .run();
  }

  async history(entityType: string, entityId: number) {
    const { results } = await this.db
      .prepare(
        `SELECT a.*, u.name as actor_name, u.email as actor_email, 
                fs.name as from_step_name, ts.name as to_step_name
         FROM approvals a
         LEFT JOIN users u ON a.actor_user_id = u.id
         LEFT JOIN workflow_steps fs ON a.from_step_id = fs.id
         LEFT JOIN workflow_steps ts ON a.to_step_id = ts.id
         WHERE a.entity_type = ? AND a.entity_id = ?
         ORDER BY a.created_at ASC`
      )
      .bind(entityType, entityId)
      .all();

    return results;
  }

  async canAct(user: AuthUser | null, requiredRole: string): Promise<boolean> {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (requiredRole === 'public') return true;
    if (user.role === requiredRole) return true;

    if (requiredRole === 'manager') {
      const today = new Date().toISOString().split('T')[0];
      const activeDelegation = await this.db
        .prepare(
          `SELECT id FROM delegations 
           WHERE delegate_id = ? AND status = 'active' AND start_date <= ? AND end_date >= ? 
           LIMIT 1`
        )
        .bind(user.id, today, today)
        .first();

      if (activeDelegation) return true;
    }

    return false;
  }
}
