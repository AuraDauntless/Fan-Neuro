import torch
import torch.nn as nn

class EEGNET(nn.Module):
    def __init__(self, num_classes=2, C=8, T=512, F1=8, D=2, F2=16, dropout=0.5):
        super().__init__()
        self.block1 = nn.Sequential(
            nn.Conv2d(1, F1, kernel_size=(1, T // 2), padding=(0, T // 4), bias=False),
            nn.BatchNorm2d(F1),
            nn.Conv2d(F1, F1 * D, kernel_size=(C, 1), groups=F1, bias=False),
            nn.BatchNorm2d(F1 * D),
            nn.ELU(),
            nn.AvgPool2d(kernel_size=(1, 4)),
            nn.Dropout(dropout),
        )
        self.block2 = nn.Sequential(
            nn.Conv2d(F1 * D, F1 * D, kernel_size=(1, 16), padding=(0, 8), groups=F1 * D, bias=False),
            nn.Conv2d(F1 * D, F2, kernel_size=(1, 1), bias=False),
            nn.BatchNorm2d(F2),
            nn.ELU(),
            nn.AvgPool2d(kernel_size=(1, 8)),
            nn.Dropout(dropout),
        )
        self._to_linear = self._get_flat_size(C, T)
        self.classifier = nn.Linear(self._to_linear, num_classes)

    def _get_flat_size(self, C, T):
        with torch.no_grad():
            x = self.block2(self.block1(torch.zeros(1, 1, C, T)))
        return x.flatten(1).shape[1]

    def forward(self, x):
        return self.classifier(self.block2(self.block1(x)).flatten(1))
