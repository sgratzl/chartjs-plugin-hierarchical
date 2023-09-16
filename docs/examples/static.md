---
title: Static Expanding
---

# Static Expanding

<script setup>
import {config} from './static';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./static.ts#config [config]

<<< ./static.ts#data [data]

:::
