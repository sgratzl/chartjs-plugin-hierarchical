---
title: Attributes
---

# Attributes

<script setup>
import {config} from './attributes';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./attributes.ts#config [config]

<<< ./attributes.ts#data [data]

:::
