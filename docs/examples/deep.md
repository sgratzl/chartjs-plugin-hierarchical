---
title: Deep Hierarchy
---

# Deep Hierarchy

<script setup>
import {config} from './deep';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./deep.ts#config [config]

<<< ./deep.ts#data [data]

:::
