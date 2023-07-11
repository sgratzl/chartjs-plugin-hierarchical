---
title: Line Chart
---

# Line Chart

<script setup>
import {config} from './line';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./line.ts#config [config]

<<< ./line.ts#data [data]

:::
