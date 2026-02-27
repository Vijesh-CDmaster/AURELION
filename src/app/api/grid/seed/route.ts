import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { GridConfig } from '@/models/GridConfig';
import { Device } from '@/models/Device';
import { AgentCluster } from '@/models/AgentCluster';
import { SimulationRecord } from '@/models/SimulationRecord';
import { Alert } from '@/models/Alert';
import { DefenseLog } from '@/models/DefenseLog';

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

/**
 * POST /api/grid/seed
 * Seeds the database with initial data if collections are empty.
 * Pass { force: true } in body to clear and re-seed.
 */
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    const results: Record<string, string> = {};

    // --- Config ---
    const existingConfig = await GridConfig.findById('default');
    if (!existingConfig || force) {
      await GridConfig.findByIdAndUpdate('default', {
        _id: 'default',
        vppEnabled: true,
        bidirectionalCharging: true,
        responseThreshold: 0.05,
        capacityReserved: 15,
        criticalWarningLevel: 0.25,
        detectionSensitivity: 'medium',
        deceptiveSignalInjection: true,
        autonomousEscalation: true,
        forecastHorizon: '30s',
        skyCamEnabled: true,
        primaryGridFeed: 'https://api.aura-sentinel.io/v1/feed',
        marlLearningRate: 0.001,
        marlDiscountFactor: 0.95,
        dataSources: [
          { name: 'Pecan Street API', status: 'connected' },
          { name: 'NREL Solar Data', status: 'connected' },
          { name: 'GridWatch Live', status: 'connected' },
        ],
      }, { upsert: true });
      results.config = 'seeded';
    } else {
      results.config = 'exists';
    }

    // --- Devices ---
    const deviceCount = await Device.countDocuments();
    if (deviceCount === 0 || force) {
      if (force) await Device.deleteMany({});
      const deviceTypes = ['EV Charger', 'HVAC', 'Home Battery', 'Solar Inverter', 'Smart Meter'];
      const clusterLabels = ['Cluster A', 'Cluster B', 'Cluster C', 'Cluster D'];
      const numDevices = randInt(8, 15);
      const devices = Array.from({ length: numDevices }, () => {
        const type = deviceTypes[randInt(0, deviceTypes.length)];
        const statusRoll = Math.random();
        const status = statusRoll > 0.15 ? 'online' : statusRoll > 0.05 ? 'responding' : 'offline';
        const loadVal = status === 'offline' ? 0 : rand(-3, 8);
        return {
          deviceId: `${type.substring(0, 2).toUpperCase()}-${randInt(100, 999)}`,
          type,
          status,
          load: `${loadVal >= 0 ? '+' : ''}${loadVal.toFixed(1)}kW`,
          cluster: clusterLabels[randInt(0, clusterLabels.length)],
          latency: status === 'offline' ? 'N/A' : `${randInt(5, 80)}ms`,
        };
      });
      await Device.insertMany(devices);
      results.devices = `seeded ${devices.length}`;
    } else {
      results.devices = `exists (${deviceCount})`;
    }

    // --- Agent Clusters ---
    const clusterCount = await AgentCluster.countDocuments();
    if (clusterCount === 0 || force) {
      if (force) await AgentCluster.deleteMany({});
      const names = ['Urban Residential', 'Industrial Zone', 'South Sector PV', 'V2G Fleet Hub', 'Commercial District'];
      const numClusters = randInt(3, 6);
      const clusters = names.slice(0, numClusters).map(name => ({
        name,
        count: randInt(100, 5000),
        response: randInt(85, 100),
        status: Math.random() > 0.2 ? 'active' : 'idle',
      }));
      await AgentCluster.insertMany(clusters);
      results.clusters = `seeded ${clusters.length}`;
    } else {
      results.clusters = `exists (${clusterCount})`;
    }

    // --- Simulation History ---
    const simCount = await SimulationRecord.countDocuments();
    if (simCount === 0 || force) {
      if (force) await SimulationRecord.deleteMany({});
      const scenarios = ['Adversarial Demand Attack', 'Sudden Cloud Shading', 'Mass EV Charging', 'Frequency Cascade', 'VPP Outage'];
      const now = new Date();
      const records = Array.from({ length: randInt(3, 6) }, () => {
        const stability = rand(78, 99);
        return {
          simId: `SIM-${String(randInt(1, 999)).padStart(3, '0')}`,
          scenario: scenarios[randInt(0, scenarios.length)],
          date: new Date(now.getTime() - randInt(1, 72) * 3600000).toLocaleString(),
          stability: `${stability.toFixed(0)}%`,
          outcome: stability > 85 ? 'SUCCESS' : 'WARNING',
          params: { intensity: randInt(20, 80), affectedNodes: randInt(200, 2000), duration: randInt(10, 90) },
          results: { maxDeviation: rand(50, 300), recoveryTime: rand(1.5, 8), energyCurtailed: rand(50, 500) },
        };
      });
      await SimulationRecord.insertMany(records);
      results.simulations = `seeded ${records.length}`;
    } else {
      results.simulations = `exists (${simCount})`;
    }

    // --- Alerts ---
    const alertCount = await Alert.countDocuments();
    if (alertCount === 0 || force) {
      if (force) await Alert.deleteMany({});
      const alertTypes = ['FREQUENCY_DIP', 'SOLAR_SHADING', 'VPP_OVERLOAD', 'ATTACK_DETECTED', 'LATENCY_SPIKE'];
      const alerts = Array.from({ length: randInt(2, 6) }, () => ({
        alertId: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        type: alertTypes[randInt(0, alertTypes.length)],
        severity: (['info', 'warning', 'critical'] as const)[randInt(0, 3)],
        message: `Auto-generated seed alert for system validation`,
        status: Math.random() > 0.3 ? 'active' : 'resolved',
      }));
      await Alert.insertMany(alerts);
      results.alerts = `seeded ${alerts.length}`;
    } else {
      results.alerts = `exists (${alertCount})`;
    }

    // --- Defense Logs ---
    const defLogCount = await DefenseLog.countDocuments();
    if (defLogCount === 0 || force) {
      if (force) await DefenseLog.deleteMany({});
      const actions = [
        'Detected phase alignment anomaly',
        'Injected noise signal',
        'Randomized agent rewards',
        'Frequency drift compensated',
        'Deployed desynchronization signals',
      ];
      const targets = ['Cluster A', 'Cluster B', 'Sector 4', 'Global', 'VPP-8'];
      const logs = Array.from({ length: randInt(3, 8) }, () => ({
        time: new Date().toLocaleTimeString(),
        action: actions[randInt(0, actions.length)],
        target: targets[randInt(0, targets.length)],
        severity: (['info', 'warning'] as const)[randInt(0, 2)],
      }));
      await DefenseLog.insertMany(logs);
      results.defenseLogs = `seeded ${logs.length}`;
    } else {
      results.defenseLogs = `exists (${defLogCount})`;
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
