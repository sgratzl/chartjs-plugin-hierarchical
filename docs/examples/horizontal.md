---
title: Horizontal Scale
---

# Horizontal Scale

<script setup>
import {config} from './horizontal';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./horizontal.ts#config [config]

<<< ./horizontal.ts#data [data]

:::
