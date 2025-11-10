#!/bin/bash

# Fix crypto import
sed -i "s/import { randomUUID } from 'crypto';/import { randomUUID } from 'node:crypto';/g" packages/simulation/src/SimulationLoop.ts
sed -i "s/import { randomUUID } from 'crypto';/import { randomUUID } from 'node:crypto';/g" packages/simulation/src/state/EventGenerator.ts

# Fix DecisionContext unused import
sed -i "s/import { DecisionMaker, type DecisionContext } from/import { DecisionMaker } from/g" packages/simulation/src/SimulationLoop.ts

# Fix unused parameters
sed -i "s/private checkTimeBasedTransitions(/private checkTimeBasedTransitions(\n    /g" packages/simulation/src/SimulationLoop.ts
sed -i "s/persona: PersonaProfile/_persona: PersonaProfile/g" packages/simulation/src/SimulationLoop.ts
sed -i "s/product: ProductState/_product: ProductState/g" packages/simulation/src/SimulationLoop.ts

echo "Fixed TypeScript issues"
