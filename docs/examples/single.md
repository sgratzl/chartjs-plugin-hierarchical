---
title: Single Element Levels
---

# Single Element Levels

<script setup>
import {config} from './single';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./single.ts#config [config]

<<< ./single.ts#data [data]

:::
