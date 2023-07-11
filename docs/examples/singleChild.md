---
title: Single Child
---

# Single Child

<script setup>
import {config} from './singleChild';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./singleChild.ts#config [config]

<<< ./singleChild.ts#data [data]

:::
