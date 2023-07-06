---
title: Examples
---

# Examples

<script setup>
import {config} from './basic';
</script>

## Hierarchical Bar Chart

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./basic.ts#config [config]

<<< ./basic.ts#data [data]

:::
